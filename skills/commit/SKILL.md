---
name: commit
description: Use when verified work is ready to be recorded in version control.
license: MIT
allowed-tools: [Read, Bash]
metadata:
  contract:
    inputs: [verified_changes, message_intent]
    reads: []
    outputs: [git_commit]
    authority: "git add and commit on the current branch. No push, no force, no commit to the default branch."
    verify: "run-tests is green AND the staged diff matches message_intent."
    accept:
      when: "never — a local commit is low-risk and reversible."
      timing: deferred
---

# Commit

Record verified work as one conventional commit.

**Core principle:** Commit only what is verified. Never commit to claim progress.

## Preconditions

- `run-tests` is green (run it now if unsure; do not trust a remembered run).
- You are NOT on the default branch (`main`/`master`). If you are, stop and ask.
- The staged change matches `message_intent` — review `git diff --staged` first.

## Steps

1. Stage only the intended files: `git add <paths>`. Never `git add .` blindly.
2. Confirm the staged diff: `git diff --staged`.
3. Confirm nothing forbidden is staged: no `dist/`, no build artifacts, no
   secrets, no `.env*`.
4. Commit with the message format below.

## Message format (required)

A conventional-commit subject, then the mandatory footer, exactly:

```
<type>(<scope>): <summary>

<optional body>

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
```

- `<type>`: feat | fix | refactor | docs | test | chore | …
- **The footer line is mandatory and exact.** A commit hook rejects commits
  without it.
- **Never** add `Co-Authored-By` or a "Claude Code" footer.

## Done

Output the commit SHA and subject. Do not push.
