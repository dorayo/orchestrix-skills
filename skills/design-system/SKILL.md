---
name: design-system
description: Use once a visual direction is chosen (or an existing UI must be codified) to write the durable design system — extracts tokens from what the human approved, completes what a sketch cannot show, and renders the system as a sheet for visual approval.
license: MIT
allowed-tools: [Read, Write, Bash, WebSearch, Grep, Glob, Skill]
metadata:
  requires:
    capabilities: [filesystem.read, filesystem.write, shell.execute, web.read, "design.canvas?"]
    model: frontier
  contract:
    inputs: [product_context, "chosen_direction?", "references?"]
    reads: [taste/brand, taste/design-system, registry/*]
    outputs: [taste/design-system, taste/brand, design_system_sheet]
    authority: "Author the durable design KB (taste/design-system, taste/brand) and the system sheet under the specs namespace. High-authority, audited (knowledge write). No source code, no production."
    verify: "Every token value traces to the chosen direction's artboard source or to existing UI source, or is marked added and appears on the system sheet; covers type + color + theme + space + motion + focus; every mode under theme.modes has a full palette; the sheet and re-rendered key screens pass the canvas check command; no AI-default tells (see anti-slop)."
    accept:
      when: "Always — the human approves the rendered sheet and key screens, not the YAML."
      timing: inline
---

# Design System

Codify the project's durable visual direction — once — so every UI after it
is consistent and unmistakably this product's. This skill does not invent the
direction: the human already chose it by looking at rendered screens
(`design-directions`), or the repo already has one in code. It extracts,
regularizes, completes, and renders the result so the human approves pixels,
not a token file.

**Posture:** Senior product designer with strong opinions about typography,
color, space, and motion. Zero tolerance for generic, AI-generated-looking
interfaces.

## Three entry paths — pick exactly one

| Entry                           | Condition                                                                  | Source of truth                                    |
| ------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| Extract from a chosen direction | `chosen_direction` names a direction in `specs/design/directions/`         | That direction's artboard source files             |
| Extract from existing UI        | `registry/*` shows a UI in the repo and there is no `chosen_direction`     | The repo's stylesheets, tokens, and components     |
| Backfill                        | `taste/design-system` exists but lacks newer fields                        | The existing system; fill only the gaps            |

If none holds, stop: the orchestrator must run `design-directions` first. Do
not invent a direction the human has never seen rendered.

## Extract — from source, not screenshots

Read the artboard `.dc.html` / `.html` source, or the repo's stylesheets and
component source. Inline styles and tokens carry exact values; a screenshot is
a guess. Lift: typeface(s), every font size and weight in use, line-heights,
colors by role (bg, surface, text, accent), spacing values, radii, borders,
control heights.

Then regularize onto scales: a type scale, a spacing scale, a palette with
named roles. When snapping changes a value, record `before → after` in the
entry's provenance so the human can see what moved and why.

## Complete — what a sketch cannot show

A low-fi direction shows the happy path in one theme. The system must also
decide the following, and each decision carries `added` provenance because the
human has not seen it yet:

- **Typography** — line-height rules and the measure for running text
  (~65 characters). Named typeface only; Inter/Roboto need a stated
  justification.
- **Color** — the contrast floor as a number. **Accent and semantic color are
  two systems:** the accent is the one brand hue; success/warning/error carry
  meaning and must read as distinct from it.
- **Theme** — `light | dark | both`, and how a mode is selected (OS
  preference, an explicit user toggle, or both). If dark is in scope, a
  **second full palette, role for role**, re-picked — never inverted: an
  accent that holds 4.5:1 on white usually fails on near-black. Light-only is
  allowed, but it must be written down so `design-review` knows there is
  nothing else to check.
- **Space** — density posture (tight/airy) tied to the product.
- **Layout** — grid and composition principles; how hierarchy is created.
- **Motion** — timing, easing, where motion is used (and where it is not), and
  what `prefers-reduced-motion` removes while keeping the UI usable.
- **Focus** — the keyboard focus indicator every interactive element carries.
  An invisible focus ring is a broken system, not a style choice.

Record the **memorable-thing** (one sentence: what a first-time viewer should
remember), the **references** (2–3 named products), and the **one distinctive
rule** — taken from the chosen direction's entry in `directions.md`, or
derived from the existing UI.

## Render — the system sheet

Write the system as artboards under `specs/design/system/`, using the same
format rules as `design-directions` (canvas files with `design.canvas`,
standalone HTML without it), and run the check command:

- `Sheet` — the type ramp at real sizes, the light palette (and the dark
  palette when declared), the spacing scale, and the core components in every
  state: button (default / hover / focus-visible / disabled), text input
  (default / focus / error), one empty state, one loading state.
- One artboard per key screen, re-rendered hi-fi on the system, in every
  declared theme mode. These are the screens `design-ui` reuses — it does not
  redraw them.

The sheet is what the human approves. A token that is not on the sheet has
not been approved.

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
Each token entry names where its value came from: `extracted: <file>`,
`extracted: <file>, snapped <before → after>`, or `added`. Leave no field of
the seed blank: `theme`, `motion.reduced_motion`, and `focus.visible_style`
are decisions, and a blank one reads to `design-review` as unspecified rather
than as "not needed". This is the source `design-ui` reads.

**Backfilling an older system.** An upgrade refreshes skills but never rewrites
an existing `knowledge/` — that brain belongs to the project. So a system
authored before `theme`, `focus.visible_style`, `motion.reduced_motion`, and
`typography.measure` existed will simply be missing them, and `design-review`
will report every dependent check against an assumed bar. When you re-run on
such a project, add those fields rather than re-authoring the whole system:
keep every existing value untouched, fill only the gaps, and give the new
entries their own `added` date and approver. Adding a dark palette to a
light-only product is a real design decision — put it on the sheet and through
the same accept gate as the rest, don't infer it.

## Self-critique before done

Look at the sheet with a designer's eye: does it still read as the direction
the human chose, or has regularizing flattened it into a template? Could you
tell it apart from a default AI UI? If not, sharpen it — and check the change
back against the chosen artboard.

## Done

Write the KB and the sheet, then stop for approval (`accept: inline`). The
orchestrator shows the sheet and the re-rendered key screens; the human
approves those. On approval, `design-ui` applies this system per feature.
Re-run only to evolve the direction or to backfill fields.
