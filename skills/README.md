# Skills (v0.1)

Capability-oriented skills, not role-oriented agents. Each skill is a single
capability with a clear contract. The `orchestrate` skill wires them together by
matching one skill's `outputs` to another's `inputs`.

Design source of truth: `cc-plans/Skill编排器与最小契约设计-v0.1.md`.

## Format

Every skill is a standard [Anthropic Agent Skill](https://agentskills.io/specification)
plus a `metadata.contract` extension. A vanilla Claude Code / Claude App / Agent
SDK runtime reads `name` + `description` + `allowed-tools` and ignores
`metadata.contract`, so each skill runs anywhere. Our orchestrator additionally
reads `metadata.contract` to wire, gate, and verify.

### The contract (6 fields)

| Field         | Meaning                                            |
| ------------- | -------------------------------------------------- |
| `description` | When to use / when NOT to use. The selection key.  |
| `inputs`      | What the skill needs to run.                       |
| `outputs`     | What it produces (enables output→input wiring).    |
| `authority`   | What it may touch / spend. Its blast radius.       |
| `verify`      | Objective, automated success check. Never skipped. |
| `accept`      | Subjective human sign-off: `{ when, timing }`.     |

`accept.timing`:

- `deferred` (default) — batch the human check at the end (lights-out middle).
- `inline` — block now. Forced by the orchestrator when `authority` is
  irreversible / high blast radius (spend, send, deploy, delete, sign).

`verify` is objective and runs autonomously. `accept` is human judgment. They
are different gates; never merge them.

## The graph (this directory)

```
intent
  └─ orchestrate (root: warm context, wires skills by output→input, enforces gates)
       ├─ brainstorm ──(needs facts?)─→ research
       ├─ (has UI?) ──→ design-system (once) → design-ui
       ├─ (arch decision?) ──→ design-architecture
       └─ draft-story → implement → run-tests → review-code → commit
                                      ↑ verify         ↑ design-review (UI only)
                                      (objective)      ↑ accept (batched)
```

Human gates are front-loaded (planning = direction) and at the very end
(acceptance); the build loop runs lights-out, gated only by objective `verify`.

### Skills

| Skill                 | Phase                    | accept             |
| --------------------- | ------------------------ | ------------------ |
| `orchestrate`         | root                     | inline (delivery)  |
| `brainstorm`          | planning                 | inline (hard gate) |
| `research`            | planning (optional)      | never              |
| `design-system`       | planning (UI, once)      | inline             |
| `design-ui`           | planning (UI only)       | inline             |
| `design-architecture` | planning (when needed)   | inline             |
| `draft-story`         | planning                 | inline (direction) |
| `implement`           | build                    | deferred           |
| `run-tests`           | build (verify primitive) | never              |
| `review-code`         | build                    | deferred           |
| `design-review`       | build (UI only)          | deferred           |
| `commit`              | build                    | deferred           |

## Attribution

The TDD, verification, and code-review disciplines adapt patterns from
[obra/superpowers](https://github.com/obra/superpowers) (MIT). The contract,
orchestration, and taste layers are original.
