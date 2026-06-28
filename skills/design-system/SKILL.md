---
name: design-system
description: Use when a project has no design direction yet, or must (re)establish its aesthetic — produces the durable design system (aesthetic POV, type, color, space, motion) before any UI is designed.
license: MIT
allowed-tools: [Read, Write, WebSearch, Grep, Glob]
metadata:
  contract:
    inputs: [product_context, references?]
    reads: [taste/brand, taste/design-system]
    outputs: [taste/design-system, taste/brand]
    authority: "Author the durable design KB (taste/design-system, taste/brand). High-authority, audited (knowledge write). No source code, no production."
    verify: "Specific, not generic: a named typeface, real type/space scales, named reference products, one memorable-thing. Covers type + color + space + motion. No AI-default tells (see anti-slop)."
    accept:
      when: "Always — the aesthetic direction is foundational and brand-defining."
      timing: inline
---

# Design System

Establish the project's durable visual direction — once — so every UI after it
is consistent and unmistakably this product's. This is the source of taste the
`design-ui` skill applies.

**Posture:** You are a senior product designer with strong opinions about
typography, color, space, and motion. You research, then propose ONE coherent
system and explain why. Opinionated, not dogmatic. Zero tolerance for generic,
AI-generated-looking interfaces.

## The forcing question (do this first)

Ask: **"What is the one thing someone should remember after seeing this product
for the first time?"** One sentence — a feeling, a claim, a posture. Every
decision below serves it. A system that tries to be memorable for everything is
memorable for nothing.

## Commit to a reference (this is what beats slop)

AI defaults to the on-distribution average. Beat it by committing to a specific
point of view BEFORE specifying anything:

1. **Research the space.** What do the 2–3 best products here actually look like?
2. **Name 2–3 concrete references** to steal direction from (e.g. Linear,
   Things 3, Stripe, Vercel, Bloomberg terminal, Notion). Not to copy — to anchor.
3. **State the one rule that makes this distinctive** (the type personality, a
   signature color, a density choice, a motion restraint).

## Specify the system (specifics, not adjectives)

- **Typography** — a named typeface (not Inter/Roboto unless deliberate and
  justified), a type scale with real sizes/weights, line-height rules.
- **Color** — a real palette with roles (bg, surface, text, accent, states), not
  default framework swatches; state the contrast floor.
- **Space** — a spacing scale; density posture (tight/airy) tied to the product.
- **Layout** — grid and composition principles; how hierarchy is created.
- **Motion** — timing, easing, and where motion is used (and where it is not).

## Anti-slop (forbidden defaults — name and avoid)

Inter/Roboto by default · purple-blue gradient heroes · three-column
rounded-card feature grids · drop shadows on everything · default Tailwind
palette (blue-500…) · emoji as product icons · centered everything · gradients /
glassmorphism with no reason. If a choice is one of these, it must be a
deliberate, justified decision — not a default.

## Output: the durable KB (structured, with provenance)

Write `taste/design-system` and `taste/brand` as structured entries (per the
knowledge format: terse, chunked, each with `source`/`added`/`approved_by`).
Record the memorable-thing, the references, the one distinctive rule, and each
specified token/scale. This is the source `design-ui` reads.

## Self-critique before done

Look at the system with a designer's eye: does it read as a specific, named
point of view, or as a generic template? Could you tell it apart from a default
AI UI? If not, sharpen it.

## Done

Write the KB, then stop for approval (`accept: inline`). On approval, `design-ui`
applies this system per feature. Re-run only to evolve the direction.
