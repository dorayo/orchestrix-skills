---
name: orchestrate
description: Use when a goal must be delivered end-to-end by composing skills, with the human approving direction at the start and the result at the end.
license: MIT
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Skill, Artifact]
metadata:
  version: 8
  requires:
    capabilities: [filesystem.read, filesystem.write, shell.execute, "agent.spawn?", "design.canvas?", "forge.pr?"]
    model: frontier
  contract:
    inputs: [intent, "constraints?"]
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
2. **Select.** Read the skill registry (the `description:` line of every
   SKILL.md in the runtime's skills directory). Pick skills by that
   when-to-use description. Load a skill's full `contract` only when it is a
   candidate — never load every contract at once.
3. **Wire (emergent, not hardcoded).** Build the path by matching one skill's
   `outputs` to the next skill's `inputs`. Skills do not know each other; only
   you do. Do not assume a fixed pipeline — wire what this intent needs.
4. **Dispatch.** Hand the skill exactly the `inputs` it declares, as files —
   resolving each logical namespace it reads/writes to a physical path via
   `core-config.yaml` (see Namespace resolution). If the runtime supports isolated
   agents, run each leaf as a fresh dispatch on the model its `requires.model`
   tier resolves to (see Model tier).
   Dispatch independent steps concurrently and await them in the same turn; keep
   dependent steps sequential. Never fire-and-forget a background agent. If the
   runtime has no isolated-agent capability, execute leaves sequentially in the
   current context, reloading only the declared inputs before each step. Isolation
   is preferred; it is not required for correctness.
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
8. **Final acceptance.** FIRST re-read the intent from the `run_start` ledger
   line and check the assembled result against IT — every step passing its own
   verify does not prove the composition serves the intent (steps can each be
   right while the whole drifts). Then present the batched deferred accepts and
   a final review to the human, once. Apply corrections (see Metabolism), then
   deliver.

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
   empty — no project-specific entries; file headers, shape comments, and
   unedited scaffold examples do NOT count — tell the human at the front gate: the brain has no preferences yet;
   offer to draft `taste/coding-standards` from existing material (CLAUDE.md,
   lint configs, review conventions) for their approval. Never seed taste
   without human sign-off (opinions enter the brain only through a human —
   same rule as Metabolism). If they decline, proceed with defaults and do not
   ask again this run.

Both checks are per-run and idempotent: a populated brain makes them no-ops.

## Hard wiring rules (what emergence cannot reach)

Output→input matching wires most of the graph. Two skills it structurally
CANNOT reach — wire these by rule, not by match:

1. **`smoke-test` is the acceptance floor for runnable apps.** Nothing in the
   graph outputs its `flows` or `run_instructions`, so no output→input match
   will ever select it. If the deliverable is a runnable app or service and
   this run changed it, wire `smoke-test` before final acceptance and derive
   its inputs yourself: `flows` from the story's acceptance criteria (or from
   the intent, when there is no story), `run_instructions` from `registry/app`
   (or the project's own manifest). `run-tests` proves functions; `smoke-test`
   proves the product — green unit tests are not this evidence. A `failed` or
   `untested` verdict is a real result: carry it into final acceptance
   verbatim, never round it up to passed.
2. **Direction → system → screens.** `design-ui` READS `taste/design-system`
   and never produces it; `design-system` codifies a direction and never
   invents one. If UI work is wired and the resolved `taste/design-system`
   namespace is empty:
   - the repo already has a UI (`registry/*` says so) → wire `design-system`
     (its extract-from-source path), then `design-ui`;
   - otherwise → wire `design-directions` first, show its artboards at the
     gate, hand the human's pick to `design-system` as `chosen_direction`,
     then `design-ui`.
   A direction the human has not seen rendered is not a direction.
3. **An epic is accepted on base, not story by story.** In collaboration
   mode (below), when every story of an origin is `done`, offer the
   integration run: on base, `smoke-test` with flows from the spec's
   acceptance criteria, final acceptance against the original intent, then
   `deploy` if asked. N green PRs prove N stories; they do not prove the
   composition. No output→input match reaches this step.

## Collaboration (team mode, opt-in)

Enabled only when `core-config.yaml` has a `collaboration:` block. Without it,
nothing in this section applies and the run behaves exactly as described
above. With it, the same loop runs; what changes is where a run lives (a
branch in its own workspace), how a run ends (a PR/MR, not a local commit),
and one preflight.

```yaml
collaboration:
  forge: github # github | gitlab — op table in the pull-request skill (and adapters/forge/<forge>.json)
  base: main
  branch: story/{origin}/{slug} # one story, one branch, one run
  plan_branch: plan/{origin} # planning runs (specs, stories, knowledge)
  workspace: worktree # worktree (same machine) | in-place (a clone elsewhere)
  pr:
    reviewers: []
```

**Principle: no new shared state.** Which stories are open, claimed, in
review, or done is derived from git and the forge every time it is needed,
never written to a board file that would need its own merge strategy.

| Story state | Derived from |
| --- | --- |
| `open` | no remote branch for the story (`git ls-remote --heads origin <branch>` is empty) and no merged PR/MR |
| `claimed` | remote branch exists, no PR/MR (`pr_for_branch` is empty) |
| `in_review` | an open PR/MR for the branch |
| `done` | the forge reports a merged PR/MR for the branch (squash merges leave no ancestry, so `git branch --merged` cannot be the source) |
| `blocked` | any story in `depends_on` is not `done` |
| `stale` | `claimed`, and the branch's last commit is older than 7 days |
| `unknown` | the forge could not be queried — never treated as `open` |

### Preflight (deterministic, after binding intent)

1. `git fetch origin`, then bring the base checkout up to date with
   `git merge --ff-only origin/<base>`. If that fails, stop: the checkout
   has diverged from base and the brain it would read is stale.
2. Run the forge `auth` op (`gh auth status` | `glab auth status`; the full
   op table is in the `pull-request` skill). Not authenticated → stop;
   logging in is the human's act on this machine.
3. `git worktree prune`, then remove worktrees whose story is `done`.
4. `.orchestrate/` must be ignored (`git check-ignore -q .orchestrate`). If
   not, add the line to `.gitignore` before anything else — a committed
   ledger conflicts on every PR.

### Planning runs end in a planning PR

A run that wires any skill writing to the specs, stories, or knowledge
namespaces (`brainstorm`, `research`, `design-*`, `draft-story`,
`map-codebase`) runs on `plan_branch` and ends with `commit` →
`pull-request`. The backlog exists for the team only once that PR is merged
to base: a story that is not on base cannot be claimed. Do not build in the
same run that planned; the builder run starts from base.

### Builder runs: pick → workspace → claim → build → pull-request

1. **Pick.** Compute the board for the origin. The intent names a story, or
   you propose the first `open`, not `blocked` story in dependency order.
   Two `open` stories whose `touches` globs overlap are serialized: name the
   conflict and pick only one. The human confirms the pick at the front gate
   you already hold. Picking is a human act; there is no assign skill.
2. **Workspace.** Create the branch without checking it out, then give it a
   working tree. Order matters: `git worktree add` refuses a branch that is
   already checked out anywhere, so the branch must not be switched to in
   the base checkout first.

   ```
   git branch <branch> origin/<base>
   git worktree add ../<repo>--<slug> <branch>     # workspace: worktree
   git switch <branch>                             # workspace: in-place
   ```

   From here on, the workspace directory is the working directory for every
   dispatch and every namespace resolution. One story per workspace is
   enforced by git itself, not by this skill.
3. **Claim — atomic on the remote.** Inside the workspace, make one empty
   commit (`git commit --allow-empty -m "chore(story): claim <slug>"`) so
   the claim has a SHA and an author, then push it so that the push fails
   if the branch already exists on the remote:

   ```
   git push -u --force-with-lease=refs/heads/<branch>: origin <branch>
   ```

   The empty expectation after the colon means "the ref must not exist". A
   rejected push (`stale info`) means someone else claimed it: remove the
   workspace (`git worktree remove`, `git branch -D`), recompute the board,
   pick again. Only after the push succeeds, write `run_start` followed by
   `workspace` in the workspace's own `.orchestrate/ledger.jsonl`.
4. **Build — unchanged.** The loop above, gated by `verify`. Namespace paths
   resolve inside the workspace.
5. **Tail.** `commit` → `pull-request`. Its `ci_status` is a verify result:
   `red` re-enters the rework loop with the failing job's log as
   `qa_feedback` (investigate first when the cause is not understood; the
   3-attempt cap applies); `pending` at the ceiling is a gate, not a pass.
6. **Deliver** when the PR/MR is open and `ci_status` is `green`. Write
   `run_end` with the `pr` URL. Merging is the reviewer's act in the forge;
   this run does not wait for it.

### Parallel hazards on one machine

Two workspaces sharing one local database, port, or container project
corrupt each other's `smoke-test` and `design-review`. Unless `registry/app`
declares the app parallel-safe (per-workspace database name, port from
`$PORT` or `0`, distinct compose project), run those two skills under a lock
file in the git common dir (`git rev-parse --git-common-dir`) so only one
workspace drives an app at a time.

## Accept gate

| Skill's `accept.timing` | Skill's `authority`                                               | Action                                                                                        |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `inline`                | any                                                               | Stop now. Get human sign-off before continuing.                                               |
| `deferred`              | reversible / low blast                                            | Record it for the final acceptance batch.                                                     |
| `deferred`              | **irreversible / high blast** (spend, send, deploy, delete, sign) | **Override to inline.** Stop and get sign-off now. A deferred review cannot un-send an email. |
| `never`                 | any                                                               | No human. Continue.                                                                           |

You are the teeth. The fields are only data; you enforce them.

**Visual gates show pixels.** When the skill at an inline gate produced
artboards (`design-directions`, `design-system`, `design-ui`), put the
rendered result in front of the human before asking: with `design.canvas`,
publish the canvas through the runtime's design skill; without it, give the
local HTML paths to open. Publishing is an outward action and belongs to you
at the gate, never to the leaf. Record the URL or path in the `gate` event's
`shows` field. Asking a human to approve a design from a token file or a
prose spec is a failed gate.

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
stop for their decision. A step that cannot pass its own verify after three
tries needs a human (wrong approach, wrong spec, or wrong verify), not more
tokens.

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

**Quoting hazard:** the single-quoted `echo` breaks on `'` inside the JSON —
and a mangled line corrupts the run's only durable memory. Keep every free-text
field (`intent`, `question`, `title`) to one line with no single quotes:
rephrase (`don't` → `do not`) before writing, never fight the shell escaping.

Events and when to write them:

| Event | When | Shape |
| ----- | ---- | ----- |
| `run_start` | right after binding intent (in collaboration mode: as the first line of the workspace's ledger) | `{"e":"run_start","run":"r-<yyyymmdd>-<slug>","intent":"...","actor":"<git user.email>","ts":"..."}` |
| `workspace` | collaboration mode only, right after `run_start` | `{"e":"workspace","run":"...","branch":"story/<origin>/<slug>","path":"<absolute workspace path>","base":"<origin/base sha at claim>","ts":"..."}` |
| `plan` | after wiring the graph, and EVERY time the graph changes | `{"e":"plan","run":"...","steps":[{"n":1,"skill":"research","title":"..."}, …]}` — full current plan; latest `plan` line wins; steps may be added, never removed |
| `step` | immediately BEFORE each dispatch, and again after its verify | `{"e":"step","run":"...","n":3,"skill":"implement","status":"dispatched\|done\|failed\|skipped","attempt":1,"model":"<resolved model, or session>","evidence":"<file or one-line result>","ts":"..."}` — rework = same `n`, next `attempt`; a step a replan made obsolete gets `skipped` with the reason in `evidence` (plan lines are never removed, so this is how an obsolete step closes) |
| `gate` | when stopping at a human gate | `{"e":"gate","run":"...","kind":"inline_accept","question":"...","shows":"<artboard URL or path, visual gates only>","ts":"..."}` |
| `run_end` | at delivery or abandonment | `{"e":"run_end","run":"...","result":"delivered\|paused\|abandoned","pr":"<PR/MR URL, collaboration mode only>","ts":"..."}` |

A step recorded `done` is done — do not re-dispatch it. `evidence` on a `done`
step is required and should be the step's verify log path
(`.orchestrate/verify/step-<n>-attempt-<k>.log`); a `done` with no evidence is
a false claim.

## Resume — cold re-entry (deterministic, not from memory)

Whenever you enter with an existing ledger — after compaction, an interrupted
session, or a wake-up — do NOT continue from what you remember. Replay:

1. Read `.orchestrate/ledger.jsonl`. The active run is the last `run_start`
   with no matching `run_end`. Its `intent` line — not your recollection — is
   what you are delivering. No active run → this is a fresh start.
2. Rebuild state from events alone: the latest `plan` wins; `done` and
   `skipped` steps are closed; prior `attempt` values count toward each step's
   cap of 3.
3. **A dangling `dispatched`** (no `done`/`failed`/`skipped` after it) means
   that attempt was cut off mid-flight. Trust it in NEITHER direction: run that
   step's verify command now. Pass → append its `done` with the evidence.
   Fail → re-dispatch as the next attempt.
4. Continue the loop from the first open step. If the run was stopped at a
   `gate`, re-ask that gate's question — never assume it was answered.
5. In collaboration mode, the `workspace` line says which branch and
   directory the run lives in. Resume from inside that workspace; the base
   checkout's ledger never holds a builder run. A `workspace` line whose
   path no longer exists means the worktree was removed: the run is
   `abandoned`, write `run_end` and say so.

## Context discipline (stay lean)

- **Files, not paste.** Move artifacts between steps as files. Never paste a
  step's full output into your context — it would be re-read every later turn.
- **The declared tier per step.** Resolve `requires.model` through the
  adapter and state the model on every dispatch (see Model tier).
- **Keep your own context small.** You coordinate; the leaves do the heavy work.

## Model tier

Every skill declares `metadata.requires.model: frontier | capable | cheap`.
Resolve it through the adapter (`adapters/<runtime>/runtime.json` → `models`)
and state the resolved model on every dispatch. The tiers encode where
judgment lives: design and review skills are `frontier` because a weaker
model converges on the generic default and a weaker reviewer misses what the
implementer missed; mechanical skills are `cheap`.

- Escalate `implement` to `frontier` when the story's scope is high-risk
  (security, data, money, irreversible).
- If the runtime cannot switch models for a step (sequential fallback), the
  step runs on the session's model. Record that model in the `step` event and
  say so at the next gate. Never silently run a `frontier` step on less.

## Red flags — stop

- Pausing to ask the human mid-run when nothing is `inline` or irreversible
- Running an irreversible-authority skill on a `deferred` accept
- Hardcoding a fixed skill order instead of wiring outputs→inputs
- Pasting a step's full output into your context instead of handing a file
- Re-dispatching a step the ledger already marks done
- Resuming from memory instead of replaying the ledger — or trusting a
  dangling `dispatched` in either direction without running its verify
- Dispatching a step without first writing its `dispatched` ledger line
- Ending a run without a `run_end` ledger line
- Marking a step done on the subagent's say-so, without your own verify command
- A 4th rework attempt on the same step (cap is 3 — stop and gate)
- A second rework attempt with no `investigate` when the failure isn't understood
- Appending to `taste/*` without reading it first (duplicate/contradiction risk)
- Dispatching a design/build skill in an existing codebase while `registry/*`
  is empty (first-run preflight skipped)
- Delivering a runnable app this run changed with no `smoke-test` verdicts
  (unit tests are not that evidence)
- Dispatching `design-ui` while the resolved `taste/design-system` is empty
- Letting `design-system` invent a direction with no `chosen_direction` and no
  existing UI
- Asking for design approval on a token file or a prose spec instead of
  rendered artboards
- Running a `frontier` step on a cheaper model without recording it in the
  ledger
- Marking the run complete without every step's `verify` evidence
- Collaboration mode: building on base, or in the same run that planned
- Collaboration mode: claiming with a plain push (two claims both succeed),
  or switching to the story branch before `git worktree add` (which then
  refuses it)
- Collaboration mode: treating `ci_status: pending` or `unknown` as green, or
  delivering a builder run with no `pr` on `run_end`
- Collaboration mode: two workspaces driving one local app with no lock
