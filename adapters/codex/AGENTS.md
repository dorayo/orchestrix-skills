<!-- orchestrix:start -->
# Orchestrix runtime guidance

- Use the skills installed under `.codex/skills/`; start end-to-end work with `orchestrate`.
- Treat each skill's `metadata.contract` as Orchestrix workflow data. Codex skill selection still depends on `name` and `description`.
- Resolve logical knowledge and work namespaces through `core-config.yaml`.
- Map capability names in `metadata.requires.capabilities` to the tools available in the current Codex session. `design.canvas` is not available: design skills write standalone HTML files, and you open them for the human at visual gates.
- Map `metadata.requires.model` tiers to models the session can select (`frontier` = the most capable available). When a step cannot switch models, record the session model in its ledger `step` event.
- When isolated agents are available, dispatch independent leaf skills concurrently and await them. Otherwise execute leaf skills sequentially in the current context, reading only their declared inputs before each step.
- Independently run every objective verification command. Never accept an agent's success report as proof.
- Keep runtime evidence at the fixed `.orchestrate/` path described by the `orchestrate` skill.
- When `core-config.yaml` has a `collaboration:` block, follow the `orchestrate` skill's Collaboration section: one story per branch per workspace (`git worktree add`, then `cd` into it — Codex has no worktree tool), builder runs end with `pull-request`, and forge operations come from that skill's op table.
<!-- orchestrix:end -->
