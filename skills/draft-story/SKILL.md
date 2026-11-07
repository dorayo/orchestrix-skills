---
name: draft-story
description: Use when an approved spec must be split into stories — because parts ship or roll back separately, must run in parallel, or are too large to verify in one diff — before any code is written.
license: MIT
allowed-tools: [Read, Write, Grep, Glob]
metadata:
  requires:
    capabilities: [filesystem.read, filesystem.write]
    model: capable
  contract:
    inputs: [spec, split_reason, context]
    reads: [taste/coding-standards, registry/api, registry/db, "front-end-spec?"]
    outputs: ["stories/<slug>.md (one per story)"]
    authority: "Write flat story files in the stories namespace (physical path from core-config.yaml; default docs/stories/). No folders. No source code. No production. No spend."
    verify: "Every spec acceptance criterion maps to at least one story AC; constraints are copied verbatim; no placeholders (no TBD/TODO/'handle edge cases'); depends_on names only stories of the same origin whose Interfaces produce what this one consumes, and the dependency graph has no cycle; touches equals the File Map; every story states release."
    accept:
      when: "Always — this output sets the direction the whole build rests on."
      timing: inline
---

# Draft Story

Split an approved spec into stories: the units that are built, verified,
released, and run in parallel separately. Called only when the orchestrator's
Sizing rule says the work must be split; an unsplit feature is built straight
from its spec. This is a direction gate: cheap to get right here, expensive to
discover wrong after a build.

**Core principle:** A story is done when an engineer with no prior context could
implement it without guessing — and it exists only because one of the split
reasons requires it. Name the reason (`split_reason`) in every story's Goal.

## Output

Write ONE flat Markdown file in the stories namespace (physical path from
`core-config.yaml`, default `docs/stories/`): `<slug>.md` — `<slug>` is a kebab
handle from the title. No folders, no `epic.story` numbering. Produce exactly
these sections (with frontmatter) and nothing more.

```markdown
---
origin: <stable short handle of the requirement this story came from>
depends_on: [] # slugs of same-origin stories whose Produces this story Consumes
touches: [] # every path in File Map (Create + Modify), as written there
release: <what shipping this story touches, in order: e.g. migration, backend, web; none if it ships with another story>
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

- **Split only along a reason.** Release boundary (it ships or rolls back on
  its own), parallelism (it can run beside the others without touching their
  files), or verify size (one diff a reviewer can read, one failure that
  points somewhere). A story that satisfies none of these merges into a
  neighbour. Each story is its own `<slug>.md` in the stories namespace, all
  sharing the spec's `origin` so the set is queryable as one group.
- **Each story traces to the spec.** Every story AC cites the spec AC it
  serves (`AC2 (spec AC1)`); every spec AC is covered by some story.
- **Flat, no hierarchy.** One file per story in the stories dir. Grouping is
  the `origin` field (a query the AI runs), never a folder. Order comes from
  Interfaces (dependencies), never from a number.
- **Dependencies and footprint are explicit.** `depends_on` is derived from
  Interfaces: a story that Consumes a signature another same-origin story
  Produces depends on it — nothing else qualifies. `touches` repeats the
  File Map so a team run can detect two stories that would edit the same
  file without opening either. Both are empty lists when there is nothing
  to list, never omitted.
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
5. Does `depends_on` name exactly the same-origin stories whose Produces
   this story Consumes, is the graph free of cycles, and does `touches` equal
   the File Map?
6. Would any two stories be cheaper as one? Merge them unless a split reason
   holds.

## Done

Write the story files in the stories namespace. Hand off their paths and the
dependency graph for direction confirmation
(this skill's `accept` is `inline`): the human approves the direction, or sends
it back, before `implement` begins.
