---
name: deploy
description: Use when an ACCEPTED deliverable must be shipped to a live environment. Never mid-run, never on unaccepted work.
license: MIT
allowed-tools: [Read, Bash]
metadata:
  contract:
    inputs: [accepted_deliverable, target]
    reads: [registry/deploy]
    outputs: [deploy_report]
    authority: "Run the project's DOCUMENTED deploy command for the named target, and its rollback. No infra provisioning, no DNS/billing/secret changes, no undocumented deploy paths."
    verify: "A real request against the LIVE target succeeds post-deploy (the deploy tool's own 'success' does not count), and one core flow responds correctly."
    accept:
      when: "always — deploying is irreversible and user-facing."
      timing: inline
---

# Deploy (Ship Accepted Work, With a Way Back)

The most dangerous skill in the graph. Everything here is designed around two
facts: deploys are user-facing, and the only safe deploy is one you can undo.

**Core principle:** No rollback plan, no deploy. If you cannot state the exact
command that undoes this deploy, you are not ready to run the one that does it.

## Preconditions — ALL must hold, verify each now

1. **The work is accepted.** Final acceptance happened; you are not deploying
   to "see if it works" (that is `smoke-test`'s job, locally).
2. **The tree is clean and tested.** `git status` clean; `run-tests` green on
   the exact commit being shipped (fresh run, not remembered).
3. **The deploy method is documented** in `registry/deploy` (or the project's
   own deploy config/scripts). Not documented → STOP and ask the human how this
   project ships. NEVER guess a deploy path — a guessed deploy against the
   wrong target is the worst failure this graph can produce.
4. **The target is unambiguous.** "Deploy" without a named target defaults to
   asking, not to production.

## Process

1. **Write the rollback plan first.** Record: the currently-live version
   identifier (commit/tag/deployment id) and the exact rollback command.
   Put both in the report BEFORE deploying.
2. **Inline human gate (this skill's accept).** Present: target, version to
   ship, one-line change summary, rollback command. Deploy only on explicit
   sign-off. This gate cannot be batched or deferred.
3. **Deploy** with the documented command. Capture the full output to
   `.orchestrate/verify/deploy-<target>.log`.
4. **Post-verify against the LIVE target.** A real HTTP request (or the
   platform equivalent) to the deployed URL: correct status AND expected
   content, plus one core flow. The deploy tool saying "success" is step 3,
   not step 4.
5. **On post-verify failure: roll back immediately** with the recorded
   command, re-verify the old version is live again, and report honestly.
   A failed deploy cleanly rolled back is a good outcome; a broken prod
   left up while you debug is not.

## Output: `deploy_report`

```markdown
# Deploy — <target>

Shipped: <version/commit> (previous live: <version>)
Command: <documented command used>
Post-verify: <request + result> — passed/failed
Rollback: <command> — standing by | EXECUTED at <time>, old version re-verified live
Log: .orchestrate/verify/deploy-<target>.log
```

## Red flags — stop

- Deploying work that has not passed final acceptance
- Guessing the deploy method because `registry/deploy` is empty
- No recorded rollback command before deploying
- Treating the deploy tool's success message as proof the site works
- An ambiguous target resolved to production by default
- Debugging a broken deploy IN production instead of rolling back first

## Done

Live target verified serving the new version (or cleanly rolled back), report
written. Durable facts learned (the deploy command, the health URL) go back to
`registry/deploy` via the metabolism rules.
