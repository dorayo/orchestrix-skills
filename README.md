# orchestrix-skills

Capability-first AI development as an **Anthropic-native skill graph**. Organize
by capability, not by role agents. A warm-context orchestrator wires small,
contract-bearing skills from intent to commit — with independent verification
that never trusts the model's self-report.

Open source (MIT). The skills run in any runtime that loads Anthropic skills
(Claude Code, Claude apps, Agent SDK). The hosted orchestrator, knowledge
hosting, and team features are the premium layer — see below.

## The graph

```
intent
  └─ orchestrate (root: warm context, wires skills by output→input, enforces gates)
       ├─ brainstorm ──(needs facts?)─→ research
       ├─ (existing repo?) ──→ map-codebase (brownfield entry: evidence-based map → registry)
       ├─ (has UI?) ──→ design-system (once) → design-ui
       ├─ (arch decision?) ──→ design-architecture
       ├─ draft-story → implement → run-tests → review-code → commit
       │                              ↑ verify         ↑ design-review (UI only)
       │                              (objective)      ↑ accept (batched)
       ├─ (verify failing, cause unknown?) ──→ investigate (root cause → rework)
       ├─ (runnable app?) ──→ smoke-test (drive real flows, evidence captured)
       └─ (accepted + ship it?) ──→ deploy (inline gate, rollback-first)
```

Human gates are front-loaded (planning = direction) and at the end (acceptance);
the build loop runs lights-out, gated only by objective `verify`.

## Install (free, no license)

```bash
npx orchestrix-skills install            # default: Claude Code (.claude/skills/)
npx orchestrix-skills install --ide cursor
```

This copies the skills into your runtime's skills dir and scaffolds `knowledge/`
+ `core-config.yaml` (it never overwrites an existing `knowledge/` — that's your
brain). Then use the `orchestrate` skill. You run it in your own runtime with
your own API key. No server, no license.

For Claude Code you can also install via the plugin marketplace:
`/plugin install orchestrix-skills`.

## How it works

- **Every skill is a standard [Anthropic Agent Skill](https://agentskills.io/specification)**
  plus a `metadata.contract` extension. Vanilla runtimes read `name` +
  `description` + `allowed-tools` and ignore the contract, so each skill runs
  anywhere. The orchestrator additionally reads the contract to wire, gate, and
  verify. See `skills/README.md`.
- **Two zones in your project:** `knowledge/` (the brain skills read — AI-primary,
  structured, with provenance) and `docs/` + `src/` (work products and the
  deliverable). `core-config.yaml` maps logical namespaces to physical paths.

## Premium (hosted)

The skills are free and open. The hosted layer is where the work runs for you:
the orchestrator-as-a-service, knowledge hosting + metabolism, team sync, and the
transparent AI software company ("建造中心"). See
[orchestrix-mcp.youlidao.ai](https://orchestrix-mcp.youlidao.ai).

## Design

Full design rationale: `Skill 编排器与最小契约设计` (the capability-first model,
the 6-field contract, lights-out accept gates, the knowledge KB, distribution).

## Attribution

The TDD, verification, and code-review disciplines adapt patterns from
[obra/superpowers](https://github.com/obra/superpowers) (MIT). The world-class
design approach draws on gstack's design skills and the anti-slop consensus. The
contract, orchestrator, knowledge layer, and graph model are original.

MIT © 2026 Orchestrix
