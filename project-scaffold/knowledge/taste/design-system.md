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
color: # roles, not framework swatches
  bg: ""
  surface: ""
  text: ""
  accent: ""
  states: { success: "", warning: "", error: "" }
  contrast_floor: "" # e.g. WCAG AA 4.5:1 body text
space:
  scale: [] # e.g. [4, 8, 12, 16, 24, 32, 48, 64]
  density: "" # tight | airy, tied to the product
motion:
  timing: "" # e.g. 150ms enter / 100ms exit
  easing: ""
  use_where: "" # and where motion is deliberately absent

provenance: { source: design-system, added: "", approved_by: "" }
```
