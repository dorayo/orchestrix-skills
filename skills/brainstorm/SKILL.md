---
name: brainstorm
description: Use before any build, when an idea or intent must become an agreed, sharp requirement and design — explores intent, weighs approaches, and decomposes if too big.
license: MIT
allowed-tools: [Read, Write, Grep, Glob]
metadata:
  contract:
    inputs: [intent, project_context]
    reads: [taste/*, architecture/*, registry/*]
    outputs: [specs/<slug>.md]
    authority: "Write to the specs namespace (default docs/specs/) only. No code, no production, no spend."
    verify: "No placeholders; no internal contradiction; single-plan scope (or explicitly decomposed); no requirement open to two readings."
    accept:
      when: "Always — HARD GATE: nothing is built before the design is approved."
      timing: inline
---

# Brainstorm

Turn a rough intent into an agreed, sharp requirement and design through
dialogue. This is the front of the funnel and the project's main direction gate.

**Core principle:** "Too simple to need a design" is where unexamined
assumptions waste the most work. Every intent gets a design — short if simple,
but always presented and approved.

> HARD GATE: do not invoke any build skill, write code, or scaffold anything
> until the design is approved. (`accept: inline`.)

## Process

1. **Explore context.** Read the relevant `knowledge/*` slices and existing
   code before asking anything.
2. **Scope check first.** If the intent spans independent subsystems, say so and
   help decompose into sub-projects — each gets its own spec → stories → build.
   Don't refine details of something that should be split.
3. **Clarify, one question at a time.** Purpose, constraints, success criteria.
   Prefer multiple-choice. Never batch questions.
4. **Propose 2–3 approaches** with trade-offs; lead with your recommendation and
   why.
5. **Present the design in sections**, scaled to complexity; confirm each
   section before moving on. Cover: behavior, data flow, error handling, testing.
6. **Apply YAGNI ruthlessly.** Cut every feature the intent does not require.

## Output: the spec

Write one file in the specs namespace (default `docs/specs/<slug>.md`):

```markdown
---
origin: <stable short handle of this intent>
---

# <Title>

## Goal — one sentence: what this delivers and for whom.

## Requirement — the agreed scope, in prose a human approved.

## Approach — the chosen approach and why (1–2 lines on rejected ones).

## Constraints — hard rules, verbatim (see draft-story).

## Downstream — flags for the orchestrator:

- needs UI design? yes/no (→ design-ui)
- needs an architecture decision? yes/no (→ design-architecture)
- open question needing facts? yes/no (→ research)

## Out of Scope — what this deliberately excludes.
```

The `Downstream` flags tell the orchestrator which planning skills to wire next.

## Spec self-review (fix inline)

1. Placeholders (TBD/TODO/vague)? Replace with the real thing.
2. Any section contradict another?
3. Single-plan scope, or does it still need decomposition?
4. Any requirement open to two readings? Pick one, make it explicit.

## Done

Write the spec, then stop for approval (`accept: inline`). On approval the
orchestrator wires the flagged planning skills, then `draft-story`. Brainstorm
never builds.
