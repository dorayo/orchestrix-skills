---
name: design-ui
description: Use when a feature has a user interface, to design its screens and flows by applying the project's design system with world-class craft, before stories are drafted.
license: MIT
allowed-tools: [Read, Write, Grep, Glob]
metadata:
  contract:
    inputs: [requirement, ui_context]
    reads: [taste/design-system, taste/brand]
    outputs: [specs/<slug>-ui.md]
    updates: [taste/design-system?, taste/brand?]
    authority: "Write to the specs namespace (default docs/specs/) and design assets. No source code, no production."
    verify: "Every screen and flow maps to a requirement; expresses the design system (not generic defaults); passes the designer's-eye self-critique."
    accept:
      when: "Visual direction — the look is foundational; everything downstream builds on it."
      timing: inline
---

# Design UI

Design a feature's UI by APPLYING the project's design system — not inventing a
one-off look. Consistency is the asset; the system is where world-class comes
from. This skill expresses it for one feature.

**Posture:** Senior product designer. Strong opinions on type, color, space,
motion. Zero tolerance for generic, AI-generated-looking screens.

## Precondition

Read `taste/design-system` + `taste/brand`. **If the design system is empty,
stop and route to `design-system` first.** Do not invent a per-feature
aesthetic — that is exactly how product consistency dies.

Carry the system's **memorable-thing** and **distinctive rule** through every
screen. If this feature can't express them, say so.

## Process

1. **Map screens to requirements.** Every screen/state must trace to a
   requirement. Cut the rest (YAGNI).
2. **Apply the system, don't restate it.** Use its typeface, scale, palette,
   spacing, motion. Reuse existing components/tokens before proposing new ones.
3. **Specify each screen:** purpose, layout and hierarchy, the system tokens
   used, and the non-happy states — loading, empty, error. These are where UIs
   actually fail.
4. **Show, don't just tell.** When a layout choice is clearer shown than
   described, produce a mockup/wireframe, not prose.

## Anti-slop (forbidden defaults)

No Inter/Roboto unless the system says so · no purple-blue gradient heroes · no
three-column rounded-card grids by reflex · no default Tailwind swatches · no
drop shadows on everything · no emoji as icons. A default is only allowed as a
deliberate, justified choice.

## Designer's-eye self-critique (mandatory gate before done)

Look at the result and ask:

- Does this look like it could ship from {the named references}, or like a
  generic AI UI? If the latter, fix it.
- Is hierarchy obvious in one glance? Is spacing on the scale? Is the
  memorable-thing visible here?
- Did any anti-slop tell sneak in?

Fix until it passes. This is the visual equivalent of `run-tests` — don't claim
done without running it.

## Output: `specs/<slug>-ui.md`

```markdown
# <Feature> — UI Spec

## Screens — each: purpose, the requirement it serves, layout + hierarchy.

## Flows — how the user moves between screens.

## States — loading / empty / error for each screen.

## System use — tokens/components used; how the memorable-thing shows up here.

## New patterns — anything the system lacked, with rationale (candidate for KB).
```

`draft-story`'s `UI Reference` points to this file.

## Metabolism

A genuinely new, reusable design decision (not feature-specific) folds back into
`taste/design-system` / `taste/brand` via `updates:` — append with provenance,
supersede rather than rewrite. Feature-only details stay in the spec.

## Done

Write the UI spec, pass the self-critique, then stop for visual approval
(`accept: inline`). On approval the orchestrator wires `draft-story`.
