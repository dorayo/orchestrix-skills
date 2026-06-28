---
name: research
description: Use when a planning or design decision needs external facts — market, competitor, feasibility, or a library/tech choice — before committing.
license: MIT
allowed-tools: [Read, WebSearch, WebFetch]
metadata:
  contract:
    inputs: [question, scope]
    reads: []
    outputs: [research/<slug>.md]
    authority: "Read-only, plus external/web reads. No code, no production, no spend."
    verify: "Every claim carries a source; the recommendation follows from the findings, not from prior belief."
    accept:
      when: "never — informational; it feeds a decision, it does not make one."
      timing: deferred
---

# Research

Answer one decision-relevant question with sourced facts, so a downstream
decision rests on evidence instead of assumption.

**Core principle:** Evidence before recommendation. A claim without a source is
an opinion — label it as one or drop it.

## Process

1. **Sharpen the question.** State exactly what decision this informs and what
   would change the answer. If the question is vague, narrow it first.
2. **Gather from several independent sources.** One source is a lead, not a fact.
3. **Verify each claim.** Cross-check; keep the source for every claim. Note
   where sources disagree.
4. **Recommend.** Give the answer the findings support, with the trade-offs. If
   the evidence is thin, say so — "insufficient evidence" is a valid result.

## Output: `research/<slug>.md`

```markdown
# <Question>

## Answer — the recommendation in one or two lines.

## Findings

- <claim> — source: <url/ref> — confidence: high/med/low

## Disagreements / gaps — where sources conflict or evidence is thin.

## So what — how this changes the downstream decision.
```

## Rules

- **No unsourced claims.** Each finding names its source.
- **Recommendation must follow from findings**, not from what you assumed going
  in. If findings contradict the assumption, say that.
- **Stay scoped.** Answer the question asked; don't expand into a survey.

## Done

Write the brief. It feeds back to `brainstorm` / `design-*` (no human gate —
`accept: never`). Durable facts it surfaces (e.g. a chosen library) become an
architecture decision via `design-architecture`, not a direct write to knowledge.
