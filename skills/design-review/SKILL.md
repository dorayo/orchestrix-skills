---
name: design-review
description: Use after a UI feature is built and running, before merging, to review the rendered interface against its UI spec, the design system, and world-class craft.
license: MIT
allowed-tools: [Read, Bash, Grep, Glob]
metadata:
  contract:
    inputs: [built_ui, ui_spec]
    reads: [taste/design-system, taste/brand]
    outputs: [design_review_report]
    authority: "Read-only on code; render and screenshot the running UI. No edits, no commits, no production."
    verify: "Report is based on actual rendered screens (screenshots), not inferred from source; contains both verdicts (spec compliance AND visual quality)."
    accept:
      when: "never — findings route back to implement; the human reviews at the end batch."
      timing: deferred
---

# Design Review

Review a built UI with a senior designer's eye. The visual counterpart of
`review-code`: two verdicts, in order — does it match the spec, then is it
world-class.

**Core principle:** You cannot review design from source. Render it and look at
the pixels. A claim about how it looks, without a screenshot, is a guess — the
visual equivalent of claiming tests pass without running them.

## Inputs

- `built_ui` — the running app (url / dev server / screenshots of each screen).
- `ui_spec` — `specs/<slug>-ui.md` it must satisfy.
- Read `taste/design-system` + `taste/brand` — the bar to calibrate against.
  Deviations from the system are higher severity, not lower.

## Look at the real thing first

Render every screen and state in the spec (loading, empty, error too). Capture
screenshots. Review those, not the CSS.

## Verdict 1 — Spec compliance

For each screen/flow/state in `ui_spec`: present and correct, missing, or wrong.
Missing a screen or a non-happy state → spec verdict FAIL.

## Verdict 2 — Visual quality

Against the design system and world-class craft:

- **Hierarchy** obvious in one glance? **Spacing** on the system's scale?
- **Consistency** with the system's type/color/tokens? Drift = defect.
- Is the **memorable-thing** actually visible here?
- **Non-happy states** real, not stubs (loading/empty/error)?
- **Interaction quality** — jank, slow transitions, layout shift?

### Anti-slop check

Flag any AI-default tell: Inter/Roboto where the system says otherwise ·
purple-blue gradient heroes · three-column rounded-card grids · default Tailwind
swatches · drop shadows on everything · emoji as icons · generic everything.

Rate each finding **Critical** (must fix) · **Important** (fix before merge) ·
**Minor** (note it).

## Output: `design_review_report`

```yaml
spec_compliance: pass # pass | fail
missing: [<screen/state not built>]
findings:
  - { severity: Important, screen: settings, issue: "...", fix: "...", shot: "..." }
verdict: changes_requested # approved | changes_requested
```

## Rules

- **Evidence-based.** Every finding names the screen and, where possible, a
  screenshot. No "looks off" without showing it.
- **Don't pre-judge.** Surface deviations; don't excuse one because the spec or a
  deadline pushed it.
- **Findings route back, not to the human.** Critical/Important go to `implement`
  (re-run with this report as `qa_feedback`). The human sees the result at the
  end-of-run acceptance.
- If it's clean and on-system, say so plainly and approve.
