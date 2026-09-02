# taste/design-system

The durable visual system `design-ui` applies. **Authored by the `design-system`
skill** — empty until then (honest). Structured, with provenance. Specifics, not
adjectives.

```yaml
memorable_thing: "" # the one thing to remember on first sight (design-system fills)
references: [] # 2-3 named products this steals direction from
distinctive_rule: "" # the one rule that makes this product's UI unmistakable

typography:
  typeface: "" # named (not Inter/Roboto unless deliberate + justified)
  scale: [] # real sizes/weights, e.g. [12/400, 14/400, 16/500, 24/600, 40/700]
  line_height: ""
  measure: "" # target line length for running text, e.g. 65ch
color: # roles, not framework swatches. THIS BLOCK IS THE LIGHT PALETTE.
  bg: ""
  surface: ""
  text: ""
  accent: "" # the one brand hue. Never used to signal state.
  states: { success: "", warning: "", error: "" } # semantic; must read as distinct from accent
  contrast_floor: "" # e.g. WCAG AA — 4.5:1 body text, 3:1 UI + graphics
theme:
  modes: "" # light | dark | both. "both" = both are designed and reviewed, not inverted.
  selection: "" # how a mode is chosen: OS preference | explicit user toggle | both
  dark: # required when modes includes dark. Same roles, re-picked — never a naive inversion.
    bg: ""
    surface: ""
    text: ""
    accent: "" # must still meet contrast_floor on the dark ground
    states: { success: "", warning: "", error: "" }
space:
  scale: [] # e.g. [4, 8, 12, 16, 24, 32, 48, 64]
  density: "" # tight | airy, tied to the product
motion:
  timing: "" # e.g. 150ms enter / 100ms exit
  easing: ""
  use_where: "" # and where motion is deliberately absent
  reduced_motion: "" # what prefers-reduced-motion removes, and what must still work without it
focus:
  visible_style: "" # the keyboard focus indicator every interactive element carries

provenance: { source: design-system, added: "", approved_by: "" }
# per token: extracted: <file> | extracted: <file>, snapped <before → after> | added
```
