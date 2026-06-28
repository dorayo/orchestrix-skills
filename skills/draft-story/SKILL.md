---
name: draft-story
description: Use when a feature request or requirement must become an implementable spec with acceptance criteria, before any code is written.
license: MIT
allowed-tools: [Read, Write, Grep, Glob]
metadata:
  contract:
    inputs: [requirement, context]
    reads: [taste/coding-standards, registry/api, registry/db, front-end-spec?]
    outputs: [docs/stories/<slug>.md]
    authority: "Write one flat story file at docs/stories/<slug>.md. No folders. No source code. No production. No spend."
    verify: "Every requirement maps to at least one acceptance criterion; constraints are copied verbatim; no placeholders (no TBD/TODO/'handle edge cases')."
    accept:
      when: "Always — this output sets the direction the whole build rests on."
      timing: inline
---

# Draft Story

Turn a requirement into one implementable story. This is the upfront direction
gate: cheap to get right here, expensive to discover wrong after a build.

**Core principle:** A story is done when an engineer with no prior context could
implement it without guessing.

## Output

Write ONE flat Markdown file: `docs/stories/<slug>.md` — `<slug>` is a kebab
handle from the title. No folders, no `epic.story` numbering. Produce exactly
these sections (with frontmatter) and nothing more.

```markdown
---
origin: <stable short handle of the requirement this story came from>
---

# <Story title>

## Goal

One sentence: what this delivers and for whom.

## Constraints

Hard rules this story must respect, one per line, copied verbatim — no
paraphrase (version floors, allowed/forbidden dependencies, naming and copy
rules, platform requirements). Every section below implicitly includes these.

## Acceptance Criteria

- AC1: <observable, testable condition>
- AC2: ...
  Every AC must be checkable by a test or a human looking at a result.

## File Map

- Create: <exact/path>
- Modify: <exact/path>
- Test: <exact/path>

## Interfaces

- Consumes: <signatures this story relies on from existing code>
- Produces: <signatures later work will rely on — exact names and types>

## UI Reference (only if the story touches UI)

Link to the front-end spec / design and name the exact screens or components in
scope. Omit this section entirely for non-UI stories.

## Out of Scope

What this story deliberately does NOT do.
```

## Rules

- **One story, one coherent deliverable.** If it spans independent subsystems,
  split into separate stories — each its own `docs/stories/<slug>.md`, all
  sharing the same `origin` so the set is queryable as one group.
- **Flat, no hierarchy.** One file per story under `docs/stories/`. Grouping is
  the `origin` field (a query the AI runs), never a folder. Order comes from
  Interfaces (dependencies), never from a number.
- **No placeholders.** "Add validation", "handle errors", "TBD" are failures.
  State the actual condition.
- **Acceptance criteria are observable.** "Works well" is not an AC. "Returns
  400 with `{error:'Email required'}` for empty email" is.
- **Stay at spec altitude.** Describe what must be true, not how to code it.
  Implementation is the `implement` skill's job.
- **Constraints are verbatim.** Copy each hard rule exactly from its source — a
  paraphrased limit is a changed limit.
- **UI Reference only when there is UI.** Omit the section for non-UI stories;
  never leave it as an empty placeholder.

## Self-review before finishing

1. Does every requirement map to an AC? List any gap, then close it.
2. Are all hard constraints copied verbatim, not paraphrased?
3. Any placeholder text? Replace with the real condition.
4. Do the names in Interfaces match across sections?

## Done

Write `docs/stories/<slug>.md`. Hand off its path for direction confirmation
(this skill's `accept` is `inline`): the human approves the direction, or sends
it back, before `implement` begins.
