---
name: investigate
description: Use when something is broken and the CAUSE is unknown — a repeatedly failing verify, a bug report, a regression — before any fix is attempted.
license: MIT
allowed-tools: [Read, Bash, Grep, Glob]
metadata:
  contract:
    inputs: [symptom, context?, prior_attempts?]
    reads: [registry/architecture, taste/coding-standards]
    outputs: [root_cause_report]
    authority: "Read code and run diagnostics/reproductions. Temporary instrumentation is allowed but MUST be reverted before finishing. No fixes — the fix belongs to a re-dispatched implement."
    verify: "The report contains a reproduction command that fails, and a mechanism that explains every observed symptom (not just the loudest one)."
    accept:
      when: "never — informational; it feeds the rework loop."
      timing: deferred
---

# Investigate (Root Cause Before Any Fix)

Debugging is not "try changes until it passes". It is locating the mechanism.

**Core principle:** A fix you cannot explain mechanistically is not a fix — it
is a coincidence that will regress.

## The Iron Law

```
NO FIX WITHOUT A ROOT CAUSE STATED AS:
"X happens BECAUSE Y — evidenced by Z (something I observed this session)"
```

## Process

1. **Reproduce.** Find the exact command/steps that show the symptom, run them,
   capture the output verbatim. Read the error LITERALLY — the message usually
   says what is wrong, not what you assume is wrong. Cannot reproduce → that IS
   the finding (report the conditions tried; do not "fix" what you cannot see).
2. **Localize.** Shrink the search space with evidence, not intuition:
   - `git log`/`git bisect` when it used to work — what changed?
   - Binary-search the pipeline: add temporary instrumentation (prints/asserts)
     at midpoints to find where good state becomes bad state.
   - Minimize the reproduction — smallest input that still fails.
3. **Hypothesize and FALSIFY.** For each hypothesis, design the observation
   that would DISPROVE it, then run it. A hypothesis you only sought
   confirmation for is not tested. Two failed rounds on the same theory →
   the bug is in an assumption one level deeper (the config, the framework
   contract, the data, the environment) — widen, don't re-try harder.
4. **State the root cause** in the iron-law form, plus:
   - the minimal fix scope (which file/function, what change class),
   - the regression test that would have caught it,
   - any OTHER symptoms this mechanism predicts (check them — a mechanism
     that doesn't explain all symptoms is incomplete).
5. **Revert your instrumentation.** `git diff` must be clean when you finish.

## Output: `root_cause_report`

```markdown
# Root cause — <symptom, one line>

## Reproduction — exact command; fails with <output tail>.
## Mechanism — X happens because Y. Evidence: Z (file:line / captured output).
## Fix scope — <file(s)>, <change class>. Explicitly NOT needed: <what a shotgun fix would have touched>.
## Regression test — <the test to add so this cannot silently return>.
## Ruled out — <hypotheses falsified and how> (saves the next person re-walking them).
```

## Red flags — stop and re-localize

- "Probably" / "might be" in the mechanism line
- A symptom fix: retry loops, sleeps, broad try/catch, widened types — with no
  mechanism behind it
- Changing several things at once and observing "it passes now"
- A mechanism that explains one symptom but not the others
- Finishing with instrumentation still in the diff

## Done

Report written; reproduction demonstrably fails; diff clean. The orchestrator
re-dispatches `implement` with this report as `qa_feedback` — same capability,
now with a target instead of a guess.
