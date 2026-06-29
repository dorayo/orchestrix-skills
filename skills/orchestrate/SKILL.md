---
name: orchestrate
description: Use when a goal must be delivered end-to-end by composing skills, with the human approving direction at the start and the result at the end.
license: MIT
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task]
metadata:
  contract:
    inputs: [intent, constraints?]
    reads: [skill-registry, taste/*]
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
   place intent enters.
2. **Select.** Read the skill registry. Pick skills by their `description`
   (when-to-use). Load a skill's full `contract` only when it is a candidate —
   never load every contract at once.
3. **Wire (emergent, not hardcoded).** Build the path by matching one skill's
   `outputs` to the next skill's `inputs`. Skills do not know each other; only
   you do. Do not assume a fixed pipeline — wire what this intent needs.
4. **Dispatch.** Hand the skill exactly the `inputs` it declares, as files. Run
   it as a fresh subagent for isolation. Choose the cheapest model that can do
   the step. **Dispatch independent steps in PARALLEL** (whose `inputs` don't
   depend on each other) — as concurrent FOREGROUND subagents awaited together in
   the same turn, for speed. Keep dependent steps sequential. NEVER fire-and-forget
   a background subagent and end the turn waiting to be woken — run foreground and
   await; there is no reliable async wake.
5. **Verify (gate).** Run the skill's `verify`. If it fails, re-dispatch the
   **same** skill with the failure as feedback (see Rework). If it passes,
   continue.
6. **Accept (gate).** Apply the rule below. Then continue — do not pause to ask
   "should I keep going?" mid-run.
7. **Repeat** 3–6 until the intent is fulfilled.
8. **Final acceptance.** Present the batched deferred accepts and a final review
   to the human, once. Apply corrections (see Metabolism), then deliver.

## Accept gate

| Skill's `accept.timing` | Skill's `authority`                                               | Action                                                                                        |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `inline`                | any                                                               | Stop now. Get human sign-off before continuing.                                               |
| `deferred`              | reversible / low blast                                            | Record it for the final acceptance batch.                                                     |
| `deferred`              | **irreversible / high blast** (spend, send, deploy, delete, sign) | **Override to inline.** Stop and get sign-off now. A deferred review cannot un-send an email. |
| `never`                 | any                                                               | No human. Continue.                                                                           |

You are the teeth. The fields are only data; you enforce them.

## Rework is a loop, not a skill

A failed `verify` or a `changes_requested` review is not a separate "fix" step.
Re-dispatch the same skill with the feedback as an input (e.g. `qa_feedback`).
Same capability, new input.

## Metabolism

When the human corrects something at final acceptance ("not on-brand", "wrong
tone"), write the correction back into the relevant `taste/*` knowledge base, so
the next run reads the improved taste. The run teaches the organization.

## Context discipline (stay lean)

- **Files, not paste.** Move artifacts between steps as files. Never paste a
  step's full output into your context — it would be re-read every later turn.
- **Ledger.** Append each finished step to a progress ledger file
  (`.orchestrate/ledger.md`). After a compaction, trust the ledger and `git
log`, not memory. A step recorded done is done — do not re-dispatch it.
- **Cheapest model per step.** Mechanical step → cheap model. Judgment step →
  capable model. State the model explicitly on every dispatch.
- **Keep your own context small.** You coordinate; the leaves do the heavy work.

## Red flags — stop

- Pausing to ask the human mid-run when nothing is `inline` or irreversible
- Running an irreversible-authority skill on a `deferred` accept
- Hardcoding a fixed skill order instead of wiring outputs→inputs
- Pasting a step's full output into your context instead of handing a file
- Re-dispatching a step the ledger already marks done
- Marking the run complete without every step's `verify` evidence
