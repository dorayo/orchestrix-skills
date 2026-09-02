---
name: design-ui
description: Use when a feature has a user interface, to design its screens and flows by applying the project's design system with world-class craft, before stories are drafted.
license: MIT
allowed-tools: [Read, Write, Bash, Grep, Glob, Skill]
metadata:
  requires:
    capabilities: [filesystem.read, filesystem.write, shell.execute, "design.canvas?"]
    model: frontier
  contract:
    inputs: [requirement, ui_context]
    reads: [taste/design-system, taste/brand]
    outputs: [specs/<slug>-ui.md, ui_artboards]
    updates: ["taste/design-system?", "taste/brand?"]
    authority: "Write to the specs namespace (default docs/specs/) and design assets under it. No source code, no production."
    verify: "Every screen and flow maps to a requirement; a treatment is declared and held to; expresses the design system (not generic defaults); copy and non-happy states are specified for every screen; every screen in the spec has a rendered artboard that passes the canvas check command; the design plan passed its critique before the spec was written."
    accept:
      when: "Always — the human approves the rendered artboards; the spec is what draft-story and design-review read."
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

## Treatment — declare one before designing

Craft is constant. Visual ambition is not. **Over-design is a defect, not
enthusiasm**: a settings page with a full-bleed hero is as wrong as a landing
page without one. Pick exactly one treatment for this feature, write it at the
top of the spec, and hold every screen to it. `design-review` checks the built
UI against the treatment you declared, so declaring `utility` and shipping
ornament is a finding.

| Treatment   | Use for                                              | Budget                                                                                                                     |
| ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `utility`   | internal tools, admin, settings, dense data screens   | Information design only. Real hierarchy, spacing on the scale, system palette. No hero, no decorative motion, no ornament.   |
| `product`   | the core user-facing surfaces — **the default**       | Full system expression. The memorable-thing is present but quiet. Motion is functional: state changes, transitions, feedback. |
| `editorial` | marketing, landing, launch, first-run onboarding      | Opinionated composition. One deliberate aesthetic risk, spent in one place; everything around it stays quiet.                 |

When the requirement doesn't say, use `product`. Escalating to `editorial` is a
choice you must justify in one sentence in the spec.

## Process

1. **Map screens to requirements.** Every screen and state must trace to a
   requirement. Cut the rest (YAGNI).
2. **Write the design plan, then attack it — before specifying anything.**
   Three to five lines: the treatment, the system tokens this feature leans on,
   the layout concept, and where the memorable-thing shows up. Then read it back
   and ask: *would this same plan work, unchanged, for any other feature in any
   other product?* Whatever survives that substitution is generic — revise it,
   and record in the spec what you changed and why. Catching this in the plan is
   far cheaper than catching it in a finished spec.
3. **Apply the system, don't restate it.** Use its typeface, scale, palette,
   spacing, motion. Reuse existing components and tokens before proposing new
   ones.
4. **Specify each screen:** purpose, layout and hierarchy, the system tokens
   used, and the non-happy states — loading, empty, error. These are where UIs
   actually fail.
5. **Specify the copy** for every screen — see below. A screen whose labels are
   unwritten is not specified.
6. **Cover every theme the system declares.** If `theme.modes` is `both`, each
   screen's spec names the tokens it uses, not literal colors, and calls out any
   place the two palettes need different treatment (elevation, dividers, images
   on a dark ground). If the system is light-only, say so once and move on.
7. **Render every screen.** Write one artboard per screen and state under
   `specs/design/<slug>/`, in every declared theme mode, using the same format
   rules as `design-directions` (canvas files with `design.canvas`, standalone
   HTML without it), and run the check command. A key screen `design-system`
   already rendered is reused, not redrawn — the spec references its file.
   The artboards are what the human approves; the spec is what machines read.
   Both are required.

## Copy is design material

Words are part of the design, not filler dropped in later. Read `taste/brand`
for voice, then write the actual strings:

- **Name things the way the user names them**, not the way the system is built.
  A person manages *notifications*, not *webhook config*.
- **A control says exactly what happens.** Button `Publish` → toast `Published`.
  Label and confirmation must use the same verb.
- **Errors state what went wrong and what to do next.** No apologies, no
  "something went wrong", no error code alone.
- **Empty states say what goes here and how to get the first one**, not "No
  data".
- Active voice. Specific beats clever. Never ship lorem ipsum or placeholder
  text into a spec — write the real string or mark it `TODO: copy`.

## When the surface is operated, not read

A dashboard, console, or tool is scanned and acted on, not read top to bottom.
For those screens the craft shifts from typography to information design:

- Summary before detail. What needs attention resolves in one glance.
- **Encode state in form, not only in number** — a pill, a chip, a severity
  stripe. Color alone is not an encoding; it fails for color-blind users and in
  a screenshot.
- **Semantic color (success / warning / error) is separate from the accent hue**
  and never counts as your accent.
- Charts and sparklines get the same care as type: a considered fill, a faint
  grid, an emphasized endpoint. Numbers in columns get tabular figures.
- What is interactive must look interactive.

## Anti-slop (forbidden defaults)

The canonical list lives in the `design-system` skill; `design-review` checks
the same one. Short form — none of these may be where you landed without
choosing: warm cream + serif + terracotta · near-black with one acid-green or
vermilion pop · purple-to-blue gradient hero · default framework swatches ·
Inter / Roboto / Space Grotesk as the safe face · three-column rounded-card
grids · accent rail on a rounded card · `rounded-lg` and drop shadows on
everything · emoji as icons · everything centered · `01 / 02 / 03` numbering on
content that is not a sequence.

A default is only allowed as a deliberate, justified choice — and any deviation
from `taste/design-system` needs the same justification.

## Designer's-eye self-critique (mandatory gate before done)

The plan critique in step 2 catches generic direction. This catches generic
execution. Look at the rendered artboards and ask:

- Does this look like it could ship from {the named references}, or like a
  generic AI UI? If the latter, fix it.
- Is hierarchy obvious in one glance? Is spacing on the scale? Is the
  memorable-thing visible here?
- **Does the ambition match the declared treatment** — nothing under-designed,
  and nothing decorated past its budget?
- Every screen: loading, empty, error specified? Copy written, not placeholder?
- Did any anti-slop tell sneak in?

Fix until it passes. This is the visual equivalent of `run-tests` — don't claim
done without running it.

## Output: `specs/<slug>-ui.md` + `specs/design/<slug>/`

```markdown
# <Feature> — UI Spec

## Treatment — utility | product | editorial, and why (one sentence).

## Design plan — the plan from step 2, plus what the critique changed and why.

## Screens — each: purpose, the requirement it serves, layout + hierarchy.

## Flows — how the user moves between screens.

## States — loading / empty / error for each screen.

## Copy — the real strings per screen: labels, confirmations, empties, errors.

## System use — tokens/components used; theme coverage; how the
memorable-thing shows up here.

## Artboards — one file per screen and state, including any reused from
design-system.

## New patterns — anything the system lacked, with rationale (candidate for KB).
```

`specs/design/<slug>/` holds the artboards (plus `canvas.json` when the canvas
is available). `draft-story`'s `UI Reference` points to the spec;
`design-review` walks the spec and uses the artboards as the visual bar.

## Metabolism

A genuinely new, reusable design decision (not feature-specific) folds back into
`taste/design-system` / `taste/brand` via `updates:` — append with provenance,
supersede rather than rewrite. Feature-only details stay in the spec.

## Done

Write the UI spec and the artboards, pass the self-critique, then stop
(`accept: inline`). The orchestrator shows the artboards; the human approves
those. On approval the orchestrator wires `draft-story`.
