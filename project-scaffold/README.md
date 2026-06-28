# Project Scaffold

What the framework installs into a **target project** (the thing being built) —
not the framework's own content. Skills (capabilities) arrive separately via MCP
or `.orchestrix/`; this scaffold is the project's durable knowledge + config.

Maps to the design doc `cc-plans/Skill编排器与最小契约设计-v0.1.md` §10.

```
<project>/
├── knowledge/     # the brain — what skills READ (reads:). AI-primary, human-audited.
│   ├── taste/         coding-standards, brand, design-system
│   ├── architecture/  structure, decisions, conventions
│   └── registry/      api, db, models
├── docs/          # work products — what skills WRITE (outputs:). Human-reviewed.
│   ├── specs/    stories/    research/   (created by skills at runtime)
├── src/  tests/   # the deliverable
└── core-config.yaml   # logical namespace → physical path mapping
```

## Two audiences, two formats

- **`knowledge/` is for the AI to read** (as context slices), and for humans to
  **audit and curate** — not to browse. Write it as **structured, chunked, terse
  data with provenance**, never as prose. See `knowledge/README.md`.
- **`docs/` is for humans to review** (they approve specs/stories at the accept
  gates) — and is also consumed by skills as handoff input. Write it **clear and
  unambiguous** so a human can judge it.

## Brownfield

Don't move existing files. Point `core-config.yaml`'s namespaces at wherever the
project already keeps that knowledge. Skills never change — only the mapping does.
