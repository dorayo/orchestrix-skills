---
name: design-system
description: Use when a project has no design direction yet, or must (re)establish its aesthetic — produces the durable design system (aesthetic POV, type, color, space, motion) before any UI is designed.
license: MIT
allowed-tools: [Read, Write, WebSearch, Grep, Glob]
metadata:
  requires:
    capabilities: [filesystem.read, filesystem.write, web.read]
  contract:
    inputs: [product_context, "references?"]
    reads: [taste/brand, taste/design-system]
    outputs: [taste/design-system, taste/brand]
    authority: "Author the durable design KB (taste/design-system, taste/brand). High-authority, audited (knowledge write). No source code, no production."
    verify: "Specific, not generic: a named typeface, real type/space scales, named reference products, one memorable-thing. Covers type + color + theme + space + motion + focus. Every mode listed under theme.modes has a full palette. No AI-default tells (see anti-slop)."
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
  justified), a type scale with real sizes/weights, line-height rules, and the
  target measure for running text (~65 characters).
- **Color** — a real palette with roles (bg, surface, text, accent, states), not
  default framework swatches; state the contrast floor as a number.
  **Accent and semantic color are two different systems.** The accent is the one
  brand hue; success/warning/error carry meaning. If the accent doubles as
  "success", state cannot be read at a glance — pick again.
- **Theme** — decide `light | dark | both`, and how a mode is selected (OS
  preference, an explicit user toggle, or both). If dark is in scope, specify a
  **second full palette, role for role**. A dark palette is re-picked, not
  inverted: an accent that holds 4.5:1 on white usually fails on near-black.
  Deciding light-only is allowed — but it must be written down as a decision, so
  `design-review` knows there is nothing else to check.
- **Space** — a spacing scale; density posture (tight/airy) tied to the product.
- **Layout** — grid and composition principles; how hierarchy is created.
- **Motion** — timing, easing, where motion is used (and where it is not), and
  what `prefers-reduced-motion` removes while keeping the UI usable.
- **Focus** — the keyboard focus indicator every interactive element carries. An
  invisible focus ring is a broken system, not a style choice.

## Anti-slop (the canonical list — `design-ui` and `design-review` check it too)

AI-generated design converges on a small set of looks. These are not banned —
they are **disqualified as defaults**. Picking one is allowed only as a stated,
justified decision, never as where you landed without choosing.

**Palettes** — warm cream ground (`#F4F1EA` and neighbors) with a serif display
and a terracotta accent · near-black with one acid-green or vermilion pop ·
purple-to-blue gradient hero on white · default framework swatches
(`blue-500`, `slate-800`, …).

**Type** — Inter, Roboto, or Space Grotesk as the "safe" face · a display face
used at body sizes so its personality never shows.

**Layout** — three-column rounded-card feature grids · an accent bar/rail down
the side of a rounded card · `rounded-lg` on everything · drop shadow on
everything · everything centered · broadsheet hairline rules over dense columns.

**Ornament** — emoji as product icons or section markers · `01 / 02 / 03`
numbering on content that is not actually a sequence · gradients or
glassmorphism with no reason.

Structural devices must encode something true. Number a set of steps only when
order is information the reader needs; otherwise the numbers are decoration
pretending to be structure.

## Output: the durable KB (structured, with provenance)

Write `taste/design-system` and `taste/brand` as structured entries (per the
knowledge format: terse, chunked, each with `source`/`added`/`approved_by`).
Record the memorable-thing, the references, the one distinctive rule, and each
specified token/scale. Leave no field of the seed blank: `theme`,
`motion.reduced_motion`, and `focus.visible_style` are decisions, and a blank
one reads to `design-review` as unspecified rather than as "not needed". This is
the source `design-ui` reads.

**Backfilling an older system.** An upgrade refreshes skills but never rewrites
an existing `knowledge/` — that brain belongs to the project. So a system
authored before `theme`, `focus.visible_style`, `motion.reduced_motion`, and
`typography.measure` existed will simply be missing them, and `design-review`
will report every dependent check against an assumed bar. When you re-run on
such a project, add those fields rather than re-authoring the whole system:
keep every existing value untouched, fill only the gaps, and give the new
entries their own `added` date and approver. Adding a dark palette to a
light-only product is a real design decision — put it through the same accept
gate as the rest, don't infer it.

## Self-critique before done

Look at the system with a designer's eye: does it read as a specific, named
point of view, or as a generic template? Could you tell it apart from a default
AI UI? If not, sharpen it.

## Done

Write the KB, then stop for approval (`accept: inline`). On approval, `design-ui`
applies this system per feature. Re-run only to evolve the direction.
