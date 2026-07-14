---
name: map-codebase
description: Use when entering an EXISTING codebase (brownfield) before designing or changing anything — build an evidence-based map of its architecture, conventions, and hazards.
license: MIT
allowed-tools: [Read, Bash, Grep, Glob]
metadata:
  contract:
    inputs: [repo_path, focus?]
    reads: []
    outputs: [codebase_map, registry_updates]
    authority: "Read-only on source; non-mutating commands only (ls, grep, git log, test discovery). Writes go ONLY to knowledge/registry/*."
    verify: "Every architectural claim in the map cites a file path you actually read; the traced flows exist in code, not in the README."
    accept:
      when: "never — informational; it feeds design and implement."
      timing: deferred
---

# Map Codebase (Brownfield Entry)

Greenfield runs start from intent; brownfield runs start from SOMEONE ELSE'S
decisions. Changing code you haven't mapped produces changes that fight the
codebase — wrong layer, wrong convention, duplicated machinery.

**Core principle:** The map comes from reading code, not from directory names
or the README. A README describes what the project wishes it were; `git log`
and the source describe what it is.

## Process

1. **Inventory.** Layout, manifests (`package.json`/`pyproject`/`go.mod`…),
   scripts, CI config, generated/vendored dirs (mark them DO-NOT-EDIT).
2. **Trace one or two REAL flows end to end** (guided by `focus` if given):
   entry point → routing/dispatch → business logic → persistence/IO. Read the
   actual files; record the chain as `file:symbol → file:symbol`. This step is
   what separates a map from a guess.
3. **Extract conventions from evidence** — for each, cite the example file you
   derived it from: naming, module boundaries, error handling style, test
   location and framework, how config/env is read, commit message style.
4. **Hazards.** Migrations and how they run; generated code and what generates
   it; global state; areas with no test coverage; anything `git log` shows as
   churn-heavy (bug-prone) or untouched-for-years (fragile assumptions).
5. **Write back to `knowledge/registry/`** following the metabolism governance
   in `orchestrate` (read-before-write, update-don't-append, facts only):
   - `registry/architecture.md` — the traced structure
   - `registry/conventions.md` — the evidenced conventions
   Registry holds FACTS about this codebase. Opinions and preferences belong
   in `taste/*`, and only via a human correction — not from this skill.

## Output: `codebase_map`

```markdown
# Codebase map — <repo> @ <commit>

## Shape — <stack, top-level layout, one paragraph>
## Traced flows
- <flow>: entry `a.ts:handler` → `b.ts:service` → `c.ts:repo` → <storage>
## Conventions (evidence-cited)
- <convention> — see <file>
## Hazards
- <hazard> — <why it bites> — <file/dir>
## Where a change like "<focus>" belongs — <layer/files>, following <convention>
```

## Red flags — stop

- Architecture described from folder names without opening the files
- Repeating a README/document claim without spot-checking it in code
- A "convention" cited from zero examples
- Writing preferences/judgments into `registry/` (facts only)
- Editing anything outside `knowledge/`

## Done

Map written with citations; registry updated. Downstream `design-architecture`
and `implement` read the registry and MUST follow the documented conventions —
that is the point of having mapped them.
