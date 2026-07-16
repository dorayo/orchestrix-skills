---
name: orchestrate
description: Use when a goal must be delivered end-to-end by composing skills, with the human approving direction at the start and the result at the end.
license: MIT
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task]
metadata:
  version: 5
  contract:
    inputs: [intent, constraints?]
    reads: [core-config, skill-registry, taste/*]
    outputs: [accepted_deliverable, run_ledger]
    authority: "Dispatch leaf skills, each within its own authority. Do not directly touch source, production, or spend — leaf skills do that, gated. Enforce every accept gate."
    verify: "Every dispatched skill's verify passed; final review is clean; all inline accepts were obtained."
    accept:
      when: "The final deliverable — once, batched."
      timing: inline
---

# Orchestrate

The root skill. The human binds intent here; this skill composes leaf skills to
fulfill it. It holds the only warm context. Leaf skills run as fresh, isolated
dispatches and keep none.

**Core principle:** Organize by capability, not by role. The human sets
direction at the start and accepts the result at the end. In between, the run is
lights-out: objective `verify` gates each step, not a human.

**This skill is the designated root.** It does not orchestrate itself. There is
no step above intent.

## The loop

1. **Bind intent.** Read the human's goal and constraints. This is the only
   place intent enters. Then run the first-run preflight (below) before any
   wiring.
2. **Select.** Read the skill registry. Pick skills by their `description`
   (when-to-use). Load a skill's full `contract` only when it is a candidate —
   never load every contract at once.
3. **Wire (emergent, not hardcoded).** Build the path by matching one skill's
   `outputs` to the next skill's `inputs`. Skills do not know each other; only
   you do. Do not assume a fixed pipeline — wire what this intent needs.
4. **Dispatch.** Hand the skill exactly the `inputs` it declares, as files —
   resolving each logical namespace it reads/writes to a physical path via
   `core-config.yaml` (see Namespace resolution). Run
   it as a fresh subagent for isolation. Choose the cheapest model that can do
   the step. **Dispatch independent steps in PARALLEL** (whose `inputs` don't
   depend on each other) — as concurrent FOREGROUND subagents awaited together in
   the same turn, for speed. Keep dependent steps sequential. NEVER fire-and-forget
   a background subagent and end the turn waiting to be woken — run foreground and
   await; there is no reliable async wake.
5. **Verify (gate) — executable, not prose.** Prove the skill's `verify` with a
   REAL command you run yourself via Bash, and capture the proof:

   ```
   .orchestrate/verify/step-<n>-attempt-<k>.log   ← exact command + exit code + output tail
   ```

   The command comes from the step's nature (test runner, build, `git fsck`,
   `test -f`, a curl against the running app …) — pick the one that would FAIL
   if the claim were false. The subagent's own success report is NOT
   verification. A prose-only verify is acceptable only when no command can
   prove the claim (e.g. judging tone) — say so in the log file. If verify
   fails, re-dispatch the **same** skill with the failure as feedback (see
   Rework). If it passes, continue.
6. **Accept (gate).** Apply the rule below. Then continue — do not pause to ask
   "should I keep going?" mid-run.
7. **Repeat** 3–6 until the intent is fulfilled.
8. **Final acceptance.** Present the batched deferred accepts and a final review
   to the human, once. Apply corrections (see Metabolism), then deliver.

## Namespace resolution (`core-config.yaml`)

Skill contracts address knowledge and work products by **logical namespace**
(`taste/*`, `architecture/*`, `registry/*`, `specs/*`, `stories/*`,
`research/*`), never by physical path. At run start, read `core-config.yaml`
once and build the logical→physical map. When you dispatch a skill, resolve
every namespace in its `reads:` / `outputs:` / `updates:` to a real path via
that map, and hand the resolved files as its inputs. If `core-config.yaml` is
absent, fall back to the scaffold defaults (`knowledge/taste`,
`knowledge/architecture`, `knowledge/registry`, `docs/specs`, `docs/stories`,
`docs/research`).

This is what makes brownfield work: a project keeps its brain wherever it
already lives, the mapping changes, the skills do not.

**Exception — the ledger/verify path is a FIXED platform protocol, not a
namespace.** Always write to `.orchestrate/ledger.jsonl` and
`.orchestrate/verify/…` literally. The platform polls that exact path to render
live progress; it is NOT resolved through `core-config.yaml` and must not be
remapped.

## First-run preflight (brownfield guard)

Emergent wiring alone can silently skip brownfield entry. So after binding
intent, run two DETERMINISTIC checks (cheap: one `ls`/`test -d` each on the
resolved paths):

1. **Empty registry + existing code → map-codebase is MANDATORY.** If the
   resolved `registry/*` namespace is empty or missing AND the repo already
   contains source code, wire `map-codebase` before any design or build skill.
   This is a hard rule, not a description-match: building on an unmapped
   codebase produces changes that fight it.
2. **Empty taste → surface it once.** If the resolved `taste/*` namespace is
   empty, tell the human at the front gate: the brain has no preferences yet;
   offer to draft `taste/coding-standards` from existing material (CLAUDE.md,
   lint configs, review conventions) for their approval. Never seed taste
   without human sign-off (opinions enter the brain only through a human —
   same rule as Metabolism). If they decline, proceed with defaults and do not
   ask again this run.

Both checks are per-run and idempotent: a populated brain makes them no-ops.

## Accept gate

| Skill's `accept.timing` | Skill's `authority`                                               | Action                                                                                        |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `inline`                | any                                                               | Stop now. Get human sign-off before continuing.                                               |
| `deferred`              | reversible / low blast                                            | Record it for the final acceptance batch.                                                     |
| `deferred`              | **irreversible / high blast** (spend, send, deploy, delete, sign) | **Override to inline.** Stop and get sign-off now. A deferred review cannot un-send an email. |
| `never`                 | any                                                               | No human. Continue.                                                                           |

You are the teeth. The fields are only data; you enforce them.

## Rework is a loop, not a skill — and the loop is BOUNDED

A failed `verify` or a `changes_requested` review is not a separate "fix" step.
Re-dispatch the same skill with the feedback as an input (e.g. `qa_feedback`).
Same capability, new input.

**Rework without understanding is a coin flip.** If a verify failure's CAUSE
is not understood after the first failed attempt, dispatch `investigate` before
spending the next attempt — its `root_cause_report` becomes the re-dispatch's
`qa_feedback`. An attempt aimed at a stated mechanism converges; an attempt
aimed at a symptom re-rolls the dice.

**Hard cap: 3 attempts per step.** If a step's verify still fails on attempt 3,
STOP the run — do not burn a 4th attempt. Write a `gate` event to the ledger
(`{"e":"gate","kind":"rework_exhausted","question":"step <n> (<skill>) failed 3
attempts: <one-line why>"}`), summarize the three failures for the human, and
report AWAIT. A step that cannot pass its own verify after three tries needs a
human decision (wrong approach, wrong spec, or wrong verify), not more tokens.

## Metabolism — governed writeback

When the human corrects something at final acceptance ("not on-brand", "wrong
tone"), fold it back into `taste/*` (preferences) or `registry/*` (facts about
this codebase), so the next run starts smarter. The run teaches the
organization — but memory rots without curation, so writeback is GOVERNED:

1. **Read before write.** Open the target file first. An existing entry on the
   same topic gets UPDATED in place — never append a near-duplicate.
2. **Contradiction = replacement.** A correction that contradicts an existing
   entry REPLACES it (add a short `supersedes: <old rule> (<date>)` note).
   Never leave both standing — two contradictory rules poison every later run
   that reads them.
3. **Durable preferences only.** Taste holds style/architecture/process
   preferences that apply to FUTURE runs. One-off task facts, transient state,
   and anything the repo or ledger already records do not belong there.
4. **One lesson per entry** — imperative phrasing, a one-line why, and a date.
5. **Size bound: ~100 lines per file.** If a write would push past it,
   consolidate in the same edit (merge near-duplicates, drop obsolete entries)
   — never blind-append to a bloated file.
6. **The human sees the diff.** taste/registry changes made during a run are
   part of final acceptance: present what changed and why, so a bad lesson can
   be vetoed before it contaminates future runs.

`taste/*` vs `registry/*`: taste is HOW we prefer things done (opinions,
overridable); registry is WHAT is true of this project (facts, verifiable).
A correction usually lands in taste; a discovered fact (the deploy command,
the test runner) lands in registry.

## The ledger (`.orchestrate/ledger.jsonl`)

The ledger is the run's durable state — for YOU (recover after compaction or an
interrupted session: trust it and `git log`, not memory) and for MACHINES (the
platform renders it as live progress). It is append-only JSONL: one JSON event
per line, appended with `Bash` (`echo '<json>' >> .orchestrate/ledger.jsonl`).
Never rewrite or delete lines. Timestamps: `date -u +%FT%TZ`.

Events and when to write them:

| Event | When | Shape |
| ----- | ---- | ----- |
| `run_start` | right after binding intent | `{"e":"run_start","run":"r-<yyyymmdd>-<slug>","intent":"...","ts":"..."}` |
| `plan` | after wiring the graph, and EVERY time the graph changes | `{"e":"plan","run":"...","steps":[{"n":1,"skill":"research","title":"..."}, …]}` — full current plan; latest `plan` line wins; steps may be added, never removed |
| `step` | immediately BEFORE each dispatch, and again after its verify | `{"e":"step","run":"...","n":3,"skill":"implement","status":"dispatched\|done\|failed","attempt":1,"evidence":"<file or one-line result>","ts":"..."}` — rework = same `n`, next `attempt` |
| `gate` | when stopping at a human gate | `{"e":"gate","run":"...","kind":"inline_accept","question":"...","ts":"..."}` |
| `run_end` | at delivery or abandonment | `{"e":"run_end","run":"...","result":"delivered\|paused\|abandoned","ts":"..."}` |

A step recorded `done` is done — do not re-dispatch it. `evidence` on a `done`
step is required and should be the step's verify log path
(`.orchestrate/verify/step-<n>-attempt-<k>.log`); a `done` with no evidence is
a false claim.

## Context discipline (stay lean)

- **Files, not paste.** Move artifacts between steps as files. Never paste a
  step's full output into your context — it would be re-read every later turn.
- **Cheapest model per step.** Mechanical step → cheap model. Judgment step →
  capable model. State the model explicitly on every dispatch.
- **Keep your own context small.** You coordinate; the leaves do the heavy work.

## Red flags — stop

- Pausing to ask the human mid-run when nothing is `inline` or irreversible
- Running an irreversible-authority skill on a `deferred` accept
- Hardcoding a fixed skill order instead of wiring outputs→inputs
- Pasting a step's full output into your context instead of handing a file
- Re-dispatching a step the ledger already marks done
- Dispatching a step without first writing its `dispatched` ledger line
- Ending a run without a `run_end` ledger line
- Marking a step done on the subagent's say-so, without your own verify command
- A 4th rework attempt on the same step (cap is 3 — stop and gate)
- A second rework attempt with no `investigate` when the failure isn't understood
- Appending to `taste/*` without reading it first (duplicate/contradiction risk)
- Dispatching a design/build skill in an existing codebase while `registry/*`
  is empty (first-run preflight skipped)
- Marking the run complete without every step's `verify` evidence
