---
name: implement
description: Use when implementing a feature or bugfix from a spec with acceptance criteria, before writing implementation code.
license: MIT
allowed-tools: [Read, Write, Edit, Bash]
metadata:
  contract:
    inputs: [story, acceptance_criteria, scope, qa_feedback?]
    reads: [taste/coding-standards, registry/api, registry/db]
    outputs: [code_diff, ac_traceability, test_files]
    authority: "Write src/ and tests/. No production, no deploy, no network spend."
    verify: "run-tests is green AND every acceptance criterion has evidence (file:line + test)."
    accept:
      when: "scope is high-risk"
      timing: deferred
---

# Implement (Test-Driven)

Write the test first. Watch it fail. Write the minimum code to pass.

**Core principle:** If you did not watch the test fail, you do not know the test
tests the right thing.

> Rework note: when `qa_feedback` is present, you are re-running this same skill
> on prior output. Read the feedback, add or fix the failing test that proves
> it, then continue the cycle. Do not start a separate "fix" process.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before its test? Delete it. Implement again from the test. "Keep it
as reference" is testing-after with extra steps.

## RED → GREEN → REFACTOR (one acceptance criterion at a time)

1. **RED** — Write one test for one behavior. Clear name. Real code, not mocks.
2. **Verify RED** — Run it. Confirm it fails, and fails because the feature is
   missing (not a typo). A test that passes now tests existing behavior — fix it.
3. **GREEN** — Write the simplest code that passes. No extra options, no
   abstraction the test does not demand (YAGNI).
4. **Verify GREEN** — Run it. The test passes, other tests still pass, output is
   clean. Failing? Fix the code, not the test.
5. **REFACTOR** — Remove duplication, improve names. Stay green. Add no behavior.
6. **Repeat** for the next acceptance criterion.

## Scope

- `scope=small` (bugfix, ≤3 files): same cycle, narrow it to the changed behavior.
- `scope=high-risk` (security, data, money, irreversible): same cycle; this
  skill's `accept` triggers a human sign-off on the result.

## AC traceability (required output)

For every acceptance criterion, record evidence — the orchestrator and
`run-tests` consume this:

```
AC1 -> code: src/auth/login.ts:42-58 | test: tests/auth/login.test.ts:'rejects empty email'
```

No evidence = the criterion is not done. Placeholders (`TODO`, empty paths) are
not evidence.

## Red flags — stop and restart the cycle

- Code written before its test
- A test that passed the first time you ran it
- You cannot explain why the test failed
- "I will add tests after" / "too simple to test" / "just this once"

## Done

`run-tests` is green, every AC has evidence. Output `code_diff`,
`ac_traceability`, and `test_files`.
