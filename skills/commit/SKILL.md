---
name: commit
description: Use when verified work is ready to be recorded in version control.
license: MIT
allowed-tools: [Read, Bash]
metadata:
  requires:
    capabilities: [filesystem.read, shell.execute]
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

## Message format

A conventional-commit subject, optional body, and whatever trailer this project
requires:

```
<type>(<scope>): <summary>

<optional body>

<project-required trailer, if any>
```

- `<type>`: feat | fix | refactor | docs | test | chore | …
- **The project decides the trailer, and it is binding.** Look for a required
  commit trailer in `CLAUDE.md` / `AGENTS.md` / contributing docs / a commit
  hook, and reproduce it EXACTLY — a hook that enforces one will reject the
  commit otherwise, and a near-miss costs a rewrite. If the project defines
  none, write no trailer.
- **Never invent a trailer**, and never add `Co-Authored-By` or a tool-attribution
  footer the project did not ask for. Whose name ends up in a project's history
  is the project's call, not this skill's.

## Done

Output the commit SHA and subject. Do not push.
