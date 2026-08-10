<!-- orchestrix:start -->
# Orchestrix runtime guidance

- Use the skills installed under `.codex/skills/`; start end-to-end work with `orchestrate`.
- Treat each skill's `metadata.contract` as Orchestrix workflow data. Codex skill selection still depends on `name` and `description`.
- Resolve logical knowledge and work namespaces through `core-config.yaml`.
- Map capability names in `metadata.requires.capabilities` to the tools available in the current Codex session.
- When isolated agents are available, dispatch independent leaf skills concurrently and await them. Otherwise execute leaf skills sequentially in the current context, reading only their declared inputs before each step.
- Independently run every objective verification command. Never accept an agent's success report as proof.
- Keep runtime evidence at the fixed `.orchestrate/` path described by the `orchestrate` skill.
<!-- orchestrix:end -->
