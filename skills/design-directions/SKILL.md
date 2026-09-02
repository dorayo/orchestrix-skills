---
name: design-directions
description: Use when a product has a UI but no settled visual direction — renders 2–4 genuinely different low-fidelity directions of the key screens so the human picks one they can SEE, before any design system is written.
license: MIT
allowed-tools: [Read, Write, Bash, Grep, Glob, Skill]
metadata:
  requires:
    capabilities: [filesystem.read, filesystem.write, shell.execute, "design.canvas?"]
    model: frontier
  contract:
    inputs: [product_context, key_screens, "references?", "direction_feedback?"]
    reads: [taste/brand, taste/design-system, registry/*]
    outputs: [design_directions]
    authority: "Write design assets under the specs namespace (default docs/specs/design/directions/). No source code, no production. Never publish or share externally — the orchestrator shows the artboards at the gate."
    verify: "2–4 directions, each named by the axis it explores; every direction renders every key screen; every artboard passes the canvas check command (or is a standalone HTML file that opens from disk); directions.md gives every direction a motivation and a tradeoff."
    accept:
      when: "Always — the human picks a direction by looking at rendered screens, never by reading tokens."
      timing: inline
---

# Design Directions

Settle the visual direction with the human, not for them. People react to a
rendered screen; they do not react to a typeface name or a hex value. So the
first thing a human sees of a new product's look is 2–4 low-fidelity screens
they can compare — and the direction they pick is what `design-system` then
codifies.

**Posture:** Senior product designer running a direction review. Breadth over
polish. Every option gets an honest case; a set where only your favorite is
argued for is a rigged vote.

## Precondition — skip when the direction is already settled

Do not explore what is already decided. Return `skipped` with a one-line
reason when either holds:

- `taste/design-system` is populated (a real system, not the unedited seed).
- `registry/*` shows an existing UI in the repo. Its look is the direction;
  `design-system` extracts it from source.

## Inputs

- `product_context` — the approved spec from `brainstorm` (goal, requirement,
  constraints).
- `key_screens` — the 2–3 screens that carry the product, from the spec's
  `Downstream` section. If the spec lists none, derive them from the
  requirement and name them at the top of `directions.md`. Never more than 3.
- `references?` — products, brands, or assets the human named.
- `direction_feedback?` — present on re-dispatch when the human rejected every
  direction. Read it first; the new set must answer it.

## Process

1. **Read the signal.** `taste/brand`, references, and the product context.
   What is the product for, and for whom? Which tone does the brief imply
   (internal tool → utilitarian; consumer → expressive)?
2. **Name 2–4 directions, each on a named axis.** An axis is a real choice:
   density (dense vs airy), type personality (editorial serif vs geometric
   sans vs mono), color stance (one accent on neutral vs tonal), tone (quiet
   vs bold). Two directions that differ only in shade are one direction —
   replace one.
3. **Sketch every key screen in every direction, low-fi.** Structure,
   hierarchy, a type pairing, one accent, real layout. Real copy where the
   brief supplies it; a bracketed placeholder like `[price]` where it does
   not. No filler sections, no emoji as icons, no fake device chrome. Low-fi
   means decision fidelity, not deliverable fidelity — enough to choose, not
   enough to ship.
4. **Author the artboards.**
   - With `design.canvas`: one artboard per direction × screen, named
     `<Direction>-<Screen>.dc.html`, plus a `canvas.json` that lays each
     direction out as one row. `Main.dc.html` is the leading candidate's
     first screen. Follow the runtime's design skill for the file format and
     run its check command; its output is the verify evidence.
   - Without it: one standalone `<Direction>-<Screen>.html` per artboard,
     self-contained (inline CSS, no external assets except Google Fonts), and
     an `index.html` that links every file under its direction name. Each
     must open from disk.
5. **Write `directions.md`.** For each direction: name, the axis it explores,
   the motivation (why it fits this product), and its main tradeoff (what it
   costs). One paragraph each. End with the key screens list.

## Anti-slop

The canonical list lives in the `design-system` skill. A direction that lands
on one of those defaults is allowed only as a stated, justified choice — and
never as two of the 2–4.

## Output: `specs/design/directions/`

```
directions.md                           # name, axis, motivation, tradeoff per direction
canvas.json                             # with design.canvas only
<Direction>-<Screen>.dc.html            # with design.canvas
<Direction>-<Screen>.html + index.html  # without it
```

## Done

Write the files, run the check, then stop (`accept: inline`). The
orchestrator puts the rendered artboards in front of the human and records
their pick as `chosen_direction`. Never pick for them. If they reject every
direction, you are re-dispatched with `direction_feedback` — same skill, new
set.
