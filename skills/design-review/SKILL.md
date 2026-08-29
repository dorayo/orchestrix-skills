---
name: design-review
description: Use after a UI feature is built and running, before merging, to review the rendered interface against its UI spec, the design system, and world-class craft.
license: MIT
allowed-tools: [Read, Bash, Grep, Glob]
metadata:
  requires:
    capabilities: [filesystem.read, shell.execute]
  contract:
    inputs: [built_ui, ui_spec, "screenshots?"]
    reads: [taste/design-system, taste/brand]
    outputs: [design_review_report]
    authority: "Read-only on code. Start and stop the app locally to render it, and drive it via browser automation or HTTP. No edits, no commits, no deploy, no external spend."
    verify: "Every verdict rests on a rendered artifact, not on source; each objective check reports pass, fail, or untested-with-reason — never a pass without its evidence; contains all three verdicts (spec compliance, rendering + accessibility, visual quality); any process this skill started was cleaned up."
    accept:
      when: "never — findings route back to implement; the human reviews at the end batch."
      timing: deferred
---

# Design Review

Review a built UI with a senior designer's eye. The visual counterpart of
`review-code`: three verdicts, in order — does it match the spec, does it
actually render correctly, and is it world-class.

**Core principle:** You cannot review design from source. Render it and look at
the pixels. A claim about how it looks, without a screenshot, is a guess — the
visual equivalent of claiming tests pass without running them.

## The Iron Law

```
UNRENDERED IS NOT PASSED. Every check ends in exactly one of:
pass (with evidence) | fail (with evidence) | untested (with the reason)
```

A review run without a browser is a partial review, and says so. It is never a
clean one.

## Inputs

- `built_ui` — the running app (a live URL, or a dev server this skill starts).
- `ui_spec` — `specs/<slug>-ui.md` it must satisfy, including its declared
  **treatment** (`utility` / `product` / `editorial`).
- `screenshots?` — captures a prior `smoke-test` already took. Use them instead
  of relaunching the app for the same screen.
- Read `taste/design-system` + `taste/brand` — the bar to calibrate against.
  Deviations from the system are higher severity, not lower.

## How to render (do this before any verdict)

Prefer what already exists: if `screenshots` covers a screen, do not relaunch
the app for it. When you must launch it yourself, follow the same protocol
`smoke-test` uses — it is the same hazard.

1. **Discover how to run it.** `registry/app` first; else the project's manifest
   (`package.json` scripts, `Makefile`, `README`). Genuinely unguessable → every
   render-dependent check is `untested: cannot launch`. Do not invent a server.
2. **Launch in the background, capture logs** to
   `.orchestrate/verify/design-review-server.log`. Record the PID. Pick a free
   port if configurable, to avoid colliding with anything already running.
3. **Wait for readiness, bounded** — poll the health endpoint / port / ready
   line for up to ~60s. Not ready → the checks are `failed: app did not start`,
   attach the server log, skip to cleanup.
4. **Render** every screen and state in the spec (loading, empty, error too), in
   every mode under the system's `theme.modes`, with the best driver available:
   - **Browser automation** (a Playwright/Chrome MCP tool, if available in this
     session) — the only driver that can reach computed style, keyboard focus,
     a media-query override, or a viewport change.
   - **Handed-in screenshots** — enough for layout, hierarchy, contrast, and the
     greyscale check; not enough for focus, computed font, or media queries.
   - **No driver at all** — state it once, mark the dependent checks `untested`,
     and still deliver Verdict 1 and every judgment call the spec supports.
5. **Capture evidence per screen** to
   `.orchestrate/verify/design-review-<screen>-<mode>.png` (or `.log`).
6. **ALWAYS clean up** — kill only the processes you started, and remove temp
   state you created. Cleanup runs even when checks fail.

Record which modes you actually rendered. An unrendered mode is `untested`,
never a passing one.

## When the design system predates these fields

A `taste/design-system` written before `theme`, `focus.visible_style`, and
`motion.reduced_motion` existed will not carry them — and an upgrade never
rewrites an existing brain, so this is the normal case for any project older
than those fields. **A missing field is unspecified, not satisfied:**

| Missing                 | Assume                                | Consequence                                                                     |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| `theme` / `theme.modes` | light-only                            | Render light. Do not fail a dark mode that was never designed.                  |
| `color.contrast_floor`  | WCAG AA — 4.5:1 text, 3:1 UI/graphics | Still measure. Label the floor `assumed` in the report.                          |
| `focus.visible_style`   | any clearly visible indicator         | Check 3 still runs; only the specific style is unspecified.                     |
| `motion.reduced_motion` | all non-essential animation stops     | Check 5 still runs.                                                              |

Every assumption goes in the report's `assumptions` list, so the human sees
which bar was applied. Raise the gap **once** as a `Minor` finding so the system
gets backfilled — never once per screen.

## Verdict 1 — Spec compliance

For each screen/flow/state in `ui_spec`: present and correct, missing, or wrong.
Missing a screen or a non-happy state → spec verdict FAIL.

## Verdict 2 — Rendering & accessibility (objective)

These are measurements, not opinions. Measure them; do not eyeball them. Each
check reports `pass`, `fail`, or `untested` with its reason — **a check you
could not run is never a pass.** The `needs` tag names what the check requires;
without it, the check is `untested`. Any failure here is at least **Important**;
anything that makes content unreadable or a control unreachable is **Critical**.

1. **Themes** *(needs: a render per declared mode)*. Render each screen in every
   declared mode. Also render the *un-stamped* default state — where no explicit
   theme is selected and only the OS preference applies — because a color
   defined solely inside a `[data-theme]` or media block never applies there,
   and the page renders one theme's text on the other theme's ground. Any text,
   icon, border, or focus ring that vanishes or loses contrast in one mode is a
   defect in that mode.
2. **Contrast** *(needs: a screenshot or computed style)*. Compute the ratios
   against `contrast_floor` for body text and for UI/graphic elements, in every
   rendered mode. Report the number, not an impression.
3. **Keyboard focus** *(needs: browser)*. Tab through every screen. Every
   interactive element has a visible focus indicator, focus order follows visual
   order, and no element traps focus. An invisible focus ring is Critical.
4. **Overflow** *(needs: browser — viewport resize)*. At the narrowest supported
   width, the page body must not scroll horizontally. Wide content — tables,
   code, charts, diagrams — scrolls inside its own container. Check for
   overlapping or clipped elements at each tested width.
5. **Reduced motion** *(needs: browser — media override)*. Render with
   `prefers-reduced-motion: reduce`. Animation is removed or reduced, and
   nothing becomes unusable or permanently invisible — scroll-reveal content
   that never reveals is Critical.
6. **Fonts actually loaded** *(needs: browser — computed style)*. Confirm the
   system's named typeface is the one rendering, not a silent fallback to a
   system face. Compare computed `font-family` against what actually painted.
7. **Spacing integrity** *(needs: a screenshot + the spacing scale)*. Gaps
   between sibling groups match the scale — no collapsed or doubled margins, no
   ad-hoc values off the scale.
8. **State without color** *(needs: a screenshot)*. Convert it to greyscale. If
   success, warning, and error can no longer be told apart, state is encoded in
   color alone — a defect, not a style.

## Verdict 3 — Visual quality (judgment)

Against the design system and world-class craft:

- **Treatment match.** Compare against the treatment the spec declared. Flag
  both directions: a `product` screen built with no hierarchy or presence, and a
  `utility` screen wearing a hero, decorative motion, or ornament it did not
  earn. **Over-design is a finding, at the same severity as under-design.**
- **Hierarchy** obvious in one glance? **Spacing** on the system's scale?
- **Consistency** with the system's type/color/tokens? Drift = defect.
- Is the **memorable-thing** actually visible here?
- **Non-happy states** real, not stubs (loading/empty/error)?
- **Copy** — do labels, confirmations, empty states, and errors match the spec
  and `taste/brand`? A control whose label and confirmation use different verbs,
  an error that only apologizes, or shipped placeholder text are all findings.
- **Interaction quality** — jank, slow transitions, layout shift?

### Anti-slop check

Flag any AI-default tell. The canonical list lives in the `design-system` skill;
short form: warm cream + serif + terracotta · near-black with one acid-green or
vermilion pop · purple-to-blue gradient hero · default framework swatches ·
Inter / Roboto / Space Grotesk where the system says otherwise · three-column
rounded-card grids · accent rail on a rounded card · `rounded-lg` and drop
shadows on everything · emoji as icons · everything centered · `01 / 02 / 03`
numbering on content that is not a sequence.

Rate each finding **Critical** (must fix) · **Important** (fix before merge) ·
**Minor** (note it).

## Output: `design_review_report`

```yaml
coverage: partial # full | partial — partial whenever any check is untested
driver: browser # browser | screenshots | none
themes_rendered: [light] # modes actually rendered; [] if none
assumptions: ["contrast_floor absent from taste/design-system — applied WCAG AA 4.5:1"]
spec_compliance: pass # pass | fail
rendering_a11y: # one verdict per check: pass | fail | untested (+ reason)
  themes: pass
  contrast: fail
  focus: untested — no browser driver in this session
  overflow: untested — no browser driver in this session
  reduced_motion: untested — no browser driver in this session
  fonts: untested — no browser driver in this session
  spacing: pass
  state_without_color: pass
missing: [<screen/state not built>]
findings:
  - {
      severity: Important,
      kind: rendering, # spec | rendering | a11y | visual | treatment | copy | anti-slop
      screen: settings,
      mode: dark,
      issue: "...",
      evidence: "measured 3.1:1 against a 4.5:1 floor",
      fix: "...",
      shot: ".orchestrate/verify/design-review-settings-dark.png",
    }
verdict: changes_requested # approved | changes_requested
cleanup: "started pid 48213, killed" # or "nothing started"
```

## Rules

- **Evidence-based.** Every finding names the screen and, where applicable, the
  theme mode and a screenshot. Objective findings carry the measurement. No
  "looks off" without showing it.
- **`untested` never rounds up.** Do not infer a check from the CSS, from a
  neighbouring screen, or from what the framework "usually" does. If `coverage`
  is `partial`, say which checks are missing in one line — an `approved` verdict
  must never imply coverage it does not have.
- **Don't pre-judge.** Surface deviations; don't excuse one because the spec or a
  deadline pushed it.
- **Findings route back, not to the human.** Critical/Important go to `implement`
  (re-run with this report as `qa_feedback`). The human sees the result at the
  end-of-run acceptance.
- If it's clean, on-system, and on-treatment, say so plainly and approve.

## Red flags — stop

- Reporting `pass` on a check you could not run
- A measurement (contrast, computed font) stated without the number
- Leaving a dev server you started still running after the report
- Failing a dark mode the design system never declared
- Raising the same missing-KB-field finding once per screen
