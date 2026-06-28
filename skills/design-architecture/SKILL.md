---
name: design-architecture
description: Use when a feature needs a new or changed architectural decision — a service, data model, cross-cutting pattern, or external integration — before stories are drafted.
license: MIT
allowed-tools: [Read, Write, Grep, Glob]
metadata:
  contract:
    inputs: [requirement, system_context]
    reads: [architecture/*, registry/api, registry/db]
    outputs: [specs/<slug>-arch.md]
    updates: [architecture/decisions, registry/api?, registry/db?]
    authority: "Write to the specs namespace (default docs/specs/) and update the architecture KB / registry. No source code, no production."
    verify: "States the alternatives and the rationale; consistent with existing decisions (or explicitly supersedes one); no placeholder."
    accept:
      when: "Always — an architecture decision is foundational; the whole build rests on it."
      timing: inline
---

# Design Architecture

Make one architectural decision a feature needs, with its rationale, and record
it durably — before any story is drafted on top of it.

**Core principle:** Decide deliberately and record why. A wrong foundation
discovered late wastes the whole build, so this is a gated, foundational step —
not something `implement` should improvise.

## Process

1. **Read the slice.** Load relevant `architecture/*` decisions and the
   `registry/api` + `registry/db` facts. Understand what already exists.
2. **State the decision needed.** One sentence: what must be decided and why it
   came up now.
3. **Weigh 2–3 alternatives** with trade-offs; pick one; say why the others lose.
4. **Check consistency.** It must not contradict an existing decision. If it
   must, explicitly supersede that decision — never silently diverge.
5. **Scope it.** Decide only what this feature forces. Don't design the whole
   system (YAGNI); leave future decisions to future features.

## Outputs

**Per-feature record** — `specs/<slug>-arch.md`:

```markdown
# <Feature> — Architecture Decision

## Decision — one line.

## Context — why it came up.

## Alternatives — what was rejected and why.

## Impact — affected modules, data, interfaces.
```

**Durable record (metabolism)** — append an ADR to `architecture/decisions`
(append/supersede, with provenance). If the decision adds or changes endpoints or
data models, update `registry/api` / `registry/db` so downstream skills read the
new facts.

## Done

Write the decision, update the KB, then stop for approval (`accept: inline`). On
approval the orchestrator wires `draft-story`, which reads the updated
`architecture/*` and `registry/*`.
