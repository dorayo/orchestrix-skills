# Skills

Capability-oriented skills, not role-oriented agents. Each skill is a single
capability with a clear contract. The `orchestrate` skill wires them together by
matching one skill's `outputs` to another's `inputs`.

## Format

Every skill is a standard [Anthropic Agent Skill](https://agentskills.io/specification)
plus a `metadata.contract` extension. A vanilla Claude Code / Claude App / Agent
SDK runtime reads `name` + `description` + `allowed-tools` and ignores
`metadata.contract`, so each skill runs anywhere. Our orchestrator additionally
reads `metadata.contract` to wire, gate, and verify.

Runtime-neutral capability requirements live under
`metadata.requires.capabilities` using names such as `filesystem.read`,
`filesystem.write`, `shell.execute`, `web.read`, and optional `agent.spawn?`.
Adapters map those names to runtime tools. Runtime-specific tool names are not
part of the orchestration contract.

`metadata.requires.model` declares the model tier a skill needs —
`frontier` (judgment: design, review, planning), `capable` (implementation),
or `cheap` (mechanical). Adapters map tiers to models under `models` in
`runtime.json`; the orchestrator states the resolved model on every dispatch.

### The contract (6 fields)

| Field         | Meaning                                            |
| ------------- | -------------------------------------------------- |
| `description` | When to use / when NOT to use. The selection key.  |
| `inputs`      | What the skill needs to run.                       |
| `outputs`     | What it produces (enables output→input wiring).    |
| `authority`   | What it may touch / spend. Its blast radius.       |
| `verify`      | Objective, automated success check. Never skipped. |
| `accept`      | Subjective human sign-off: `{ when, timing }`.     |

**Optional entries** in `inputs` / `reads` / `updates` carry a trailing `?` and
**must be quoted** — `"qa_feedback?"`, not `qa_feedback?`. A bare `?` inside a
YAML flow sequence is not valid YAML; permissive loaders accept it, strict ones
reject the whole file.

**Names are semantic, not literal.** `inputs` name the role a skill needs
(`story`, `diff`, `spec`); `outputs` name the artifact produced
(`stories/<slug>.md`, `code_diff`). The orchestrator matches them by meaning —
do not expect string equality when reading the graph.

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
       ├─ (has UI?) ──→ design-directions (human picks a rendered direction) → design-system (once) → design-ui
       ├─ (arch decision?) ──→ design-architecture
       └─ draft-story → implement → run-tests → review-code → commit ──(team mode)─→ pull-request
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
| `design-directions`   | planning (UI, once)      | inline             |
| `design-system`       | planning (UI, once)      | inline             |
| `design-ui`           | planning (UI only)       | inline             |
| `design-architecture` | planning (when needed)   | inline             |
| `draft-story`         | planning                 | inline (direction) |
| `implement`           | build                    | deferred           |
| `run-tests`           | build (verify primitive) | never              |
| `review-code`         | build                    | deferred           |
| `design-review`       | build (UI only)          | deferred           |
| `commit`              | build                    | deferred           |
| `pull-request`        | build (team mode)        | inline (first open) |

## Attribution

The TDD, verification, and code-review disciplines adapt patterns from
[obra/superpowers](https://github.com/obra/superpowers) (MIT). The contract,
orchestration, and taste layers are original.
