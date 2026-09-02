# orchestrix-skills

Capability-first AI development as an **Anthropic-native skill graph**. Organize
by capability, not by role agents. A warm-context orchestrator wires small,
contract-bearing skills from intent to commit — with independent verification
that never trusts the model's self-report.

Open source (MIT). The skills run in any runtime that loads Anthropic skills
(Claude Code, Claude apps, Agent SDK). You run them in your own runtime with your
own API key: no server, no license, no telemetry.

## The graph

```
intent
  └─ orchestrate (root: warm context, wires skills by output→input, enforces gates)
       ├─ brainstorm ──(needs facts?)─→ research
       ├─ (existing repo?) ──→ map-codebase (brownfield entry: evidence-based map → registry)
       ├─ (has UI?) ──→ design-directions (human picks a rendered direction) → design-system (once) → design-ui
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

## Install

```bash
npx orchestrix-skills install             # default: Claude Code (.claude/skills/)
npx orchestrix-skills install --ide codex # Codex (.codex/skills/ + AGENTS.md)
npx orchestrix-skills install --ide cursor
npx orchestrix-skills doctor --ide codex  # validate an installation
```

This copies the skills into your runtime's skills dir and scaffolds `knowledge/`
+ `core-config.yaml` (it never overwrites an existing `knowledge/` — that is your
brain). Then use the `orchestrate` skill.

For Claude Code you can also install from the plugin marketplace:
`/plugin install orchestrix-skills`.

### Upgrading, and how hosts automate it

Re-running `install` refreshes the skills in place. It also writes a stamp at
`<skills-dir>/.orchestrix-skills.json`:

```json
{ "version": "0.10.0", "ide": "claude", "skills": ["brainstorm", "commit", "…"] }
```

Two things read it. The installer prunes skills a previous version placed that
the package no longer ships — and only those names, so a skill you or your
platform installed alongside them is never touched. And a host that provisions
projects can compare `version` against the npm dist-tag to decide whether to
reinstall, instead of maintaining its own version constant that silently drifts.

The stamp is written last: a run that dies mid-copy leaves the older stamp
behind, so the next run still sees a mismatch and reinstalls rather than
declaring itself current.

## What `orchestrate` guarantees

The root skill is where the interesting engineering lives. Beyond wiring:

- **Verification is executable.** Each step's `verify` must be proven by a real
  command the orchestrator runs itself, with the command, exit code, and output
  tail captured to `.orchestrate/verify/step-<n>-attempt-<k>.log`. A subagent's
  own success report is not evidence.
- **State lives outside the context window.** Every run appends to
  `.orchestrate/ledger.jsonl` (`run_start` / `plan` / `step` / `gate` /
  `run_end`). The ledger is the run's durable memory, not the conversation.
- **Cold re-entry is deterministic.** After compaction, an interruption, or a
  wake-up, the orchestrator replays the ledger instead of trusting recall. A
  step left dangling at `dispatched` is trusted in neither direction: its verify
  command is re-run to decide whether it completed.
- **Rework is bounded.** A failed verify re-dispatches the same skill with the
  failure as input — capped at 3 attempts, and a failure whose cause is not
  understood goes to `investigate` first, so the retry aims at a mechanism
  rather than re-rolling the dice.
- **Accept gates are enforced by authority, not by declaration.** A skill that
  spends, sends, deploys, deletes, or signs is escalated to an inline human gate
  even if it asked for a deferred one.
- **Two rules are hard-wired** because output→input matching structurally cannot
  reach them: `smoke-test` is the acceptance floor for a runnable app the run
  changed, and visual work runs direction → system → screens, with the human
  approving rendered artboards at each gate rather than token files.
- **Model tiers are declared, not guessed.** Each skill states
  `requires.model: frontier | capable | cheap`; the adapter maps the tier to a
  model, and the resolved model is recorded on every ledger step.

## Runtime adapters

`skills/` is the runtime-neutral source of truth. `adapters/` describes how a
runtime maps generic capabilities to its tools. During a Codex install the CLI
removes Claude-only `allowed-tools`, preserves the contract, and adds Codex
runtime guidance. If the target has an unmanaged `AGENTS.md`, its content is left
untouched and the guidance is placed at `.codex/orchestrix/AGENTS.md` for manual
merging. Installer-created guidance uses a marked block, so later installs
refresh that block while preserving surrounding user instructions.

`doctor` validates every installed skill's required frontmatter, the Codex
transformation, configuration shape, knowledge directory, and active root
guidance. A reference file that has not been merged into an existing root
`AGENTS.md` is reported as unhealthy rather than silently treated as active.

Codex uses isolated agents when the active session exposes them and otherwise
runs leaf skills sequentially. Cursor and Windsurf remain reference-rule installs
until those runtimes provide native compatible skill execution.

## How it works

- **Every skill is a standard [Anthropic Agent Skill](https://agentskills.io/specification)**
  plus a `metadata.contract` extension. Vanilla runtimes read `name` +
  `description` + `allowed-tools` and ignore the contract, so each skill runs
  anywhere. The orchestrator additionally reads the contract to wire, gate, and
  verify. See `skills/README.md`.
- **Two zones in your project:** `knowledge/` (the brain skills read — AI-primary,
  structured, with provenance) and `docs/` + `src/` (work products and the
  deliverable). `core-config.yaml` maps logical namespaces to physical paths, so
  a project keeps its brain wherever it already lives.

## Hosted

A hosted layer — orchestrator-as-a-service, knowledge hosting, and team features
— is available separately at
[orchestrix-mcp.youlidao.ai](https://orchestrix-mcp.youlidao.ai). Nothing in this
package requires it or talks to it.

## Attribution

The TDD, verification, and code-review disciplines adapt patterns from
[obra/superpowers](https://github.com/obra/superpowers) (MIT). The world-class
design approach draws on gstack's design skills and the anti-slop consensus. The
contract, orchestrator, knowledge layer, and graph model are original.

MIT © 2026 Orchestrix
