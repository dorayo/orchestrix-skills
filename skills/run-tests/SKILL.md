---
name: run-tests
description: Use before claiming any work is complete, fixed, or passing, and before committing or handing off.
license: MIT
allowed-tools: [Read, Bash]
metadata:
  contract:
    inputs: [target, expected_outcome?]
    reads: []
    outputs: [verification_report]
    authority: "Run test, lint, and build commands. Read-only on source. No edits, no production."
    verify: "self — this skill IS the objective verification primitive."
    accept:
      when: "never"
      timing: deferred
---

# Run Tests (Verify Before Completion)

Claiming work is done without running the check is a false claim, not a shortcut.

**Core principle:** Evidence before claims, always. If you did not run the
command in this step, you cannot say it passes.

## The Iron Law

```
NO COMPLETION CLAIM WITHOUT FRESH VERIFICATION EVIDENCE
```

## The gate

```
1. IDENTIFY the command that proves the claim.
2. RUN it fully and fresh (not a remembered run).
3. READ the full output: exit code, pass/fail counts, warnings.
4. DECIDE: output confirms the claim, or it does not.
5. REPORT the claim WITH the evidence.
```

## Verify independently — do not trust self-reports

| Claim                   | Proof required                      | Not sufficient                |
| ----------------------- | ----------------------------------- | ----------------------------- |
| Tests pass              | Test command output: 0 failures     | "should pass", a previous run |
| Build succeeds          | Build command: exit 0               | linter passed                 |
| Bug fixed               | Test of the original symptom passes | code changed, assumed fixed   |
| Another skill succeeded | Its diff and tests checked here     | its success report            |

A regression test counts only after a red→green check: revert the fix, watch
the test fail, restore the fix, watch it pass.

## Output: `verification_report`

```yaml
target: <what was checked>
command: <exact command run>
exit_code: 0
result: { passed: 34, failed: 0, warnings: 0 }
verdict: pass # pass | fail
evidence: |
  <relevant lines of real output>
```

`verdict: fail` is a valid, honest result. Report it with evidence; never round
a failure up to a pass.

## Red flags — stop

- "should", "probably", "looks correct", "Done!" before running the command
- Reusing an earlier run's result
- Partial check used to claim full success
- Trusting "the agent said it worked"
