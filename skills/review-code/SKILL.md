---
name: review-code
description: Use after implementing a task or feature and before merging, to check a diff against its spec and for quality.
license: MIT
allowed-tools: [Read, Bash, Grep, Glob]
metadata:
  contract:
    inputs: [diff, spec]
    reads: [taste/coding-standards]
    outputs: [review_report]
    authority: "Read-only on code. Produces a report. No edits, no commits, no production."
    verify: "Report contains both verdicts: spec compliance AND code quality."
    accept:
      when: "never — findings route back to implement; the human reviews at the end batch."
      timing: deferred
---

# Review Code

Review a diff against its spec with fresh eyes. Two verdicts, in order: does it
do what was asked, then is it well built.

**Core principle:** Review the work product against the spec — not the author's
reasoning. You get the diff and the spec, not the session that produced them.

## Inputs

- `diff` — the change to review (a base..head range or a diff file).
- `spec` — the story / acceptance criteria the change must satisfy.

Read the spec first. It is your attention lens. Then read the full diff.

## Verdict 1 — Spec compliance

For each acceptance criterion: met, missing, or extra (built but not asked for).

- **Missing** a criterion → spec verdict is FAIL.
- **Extra** scope not in the spec → flag it; over-building is a defect.

## Verdict 2 — Code quality

Check, against `taste/coding-standards`:

- Correctness and edge cases the tests miss
- Duplication, unclear names, dead code
- Tests that assert nothing or test mocks instead of behavior
- Security / data-loss / trust-boundary issues (always Critical)

Rate each finding: **Critical** (must fix) · **Important** (fix before merge) ·
**Minor** (note it).

## Output: `review_report`

```yaml
spec_compliance: pass # pass | fail
missing: [<AC not met>]
extra: [<scope not requested>]
findings:
  - { severity: Important, where: src/x.ts:40, issue: "...", fix: "..." }
verdict: changes_requested # approved | changes_requested
```

## Rules

- **Do not pre-judge.** Never decide a finding is fine because "the spec said
  so" — surface it; conflicts with the spec are the human's call, not yours.
- **Be specific.** Every finding has a location and a concrete fix.
- **Findings route back, not to the human.** Critical/Important findings go to
  `implement` (re-run with this report as `qa_feedback`). The human sees the
  result at the end-of-run acceptance, not each review.
- If the diff is clean, say so plainly and approve.
