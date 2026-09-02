---
name: pull-request
description: Use when a verified story branch (or a planning branch) must be published for team review as a pull request (GitHub) or merge request (GitLab), and its CI result pulled back into the run. Never merges. Not for solo runs with no collaboration block.
license: MIT
allowed-tools: [Read, Bash]
metadata:
  requires:
    capabilities: [filesystem.read, shell.execute, forge.pr]
    model: cheap
  contract:
    inputs: [branch, story, verification_report, "ac_traceability?", "review_report?", "smoke_report?", "design_review_report?", "pr?"]
    reads: [core-config]
    outputs: [pr_url, ci_status]
    authority: "Rebase the current branch onto base, push it, and open or update ONE pull/merge request against base. Never merge, never push to base, never force-push over commits you did not make (--force-with-lease only), never change forge settings."
    verify: "The forge returns a PR/MR for the branch whose head SHA equals local HEAD; ci_status is green, red, or pending — never unknown; the body lists every acceptance criterion with its evidence."
    accept:
      when: "The first open of a PR/MR — the human approves title, body, and reviewers once. Later updates to the same PR/MR need no gate."
      timing: inline
---

# Pull Request

Publish a verified branch for team review. A pull request (GitHub) and a merge
request (GitLab) are the same object: a request to merge one branch into
another with review and CI attached. This skill speaks to whichever forge
`core-config.yaml` names and treats the two identically.

**Core principle:** The PR body is the run's evidence, made portable. Verify
logs live in `.orchestrate/`, which never leaves the machine. A reviewer on
another machine sees only what this skill puts in the body — so the body is
assembled from the run's files, never from memory.

## Preconditions — verify each now

1. `core-config.yaml` has a `collaboration:` block. Absent → this skill does
   not apply; stop and say so.
2. The forge CLI is authenticated: run the `auth` op. Not authenticated →
   stop; authentication is the human's act on this machine.
3. The current branch matches `collaboration.branch` (story) or
   `collaboration.plan_branch` (planning), and is not `collaboration.base`.
4. `verification_report` is a fresh green run — not a remembered one.

## Forge operations

`collaboration.forge` selects the column. Substitute `{base}`, `{branch}`,
`{pr}`, `{title}`, `{body_file}`. The same table ships as
`adapters/forge/<forge>.json` for tools that read it as data; the two are
kept identical by test.

| Op | GitHub (`gh`) | GitLab (`glab`) |
| --- | --- | --- |
| `auth` | `gh auth status` | `glab auth status` |
| `pr_for_branch` | `gh pr list --head {branch} --state all --json number,url,state,isDraft,headRefOid,mergedAt` | `glab mr list --source-branch {branch} --all --output json` |
| `pr_create_draft` | `gh pr create --draft --base {base} --head {branch} --title {title} --body-file {body_file}` | `glab mr create --draft --yes --source-branch {branch} --target-branch {base} --title {title} --description "$(cat {body_file})"` |
| `pr_view` | `gh pr view {pr} --json number,url,state,isDraft,headRefOid,baseRefName` | `glab mr view {pr} --output json` |
| `pr_update_body` | `gh pr edit {pr} --body-file {body_file}` | `glab mr update {pr} --description "$(cat {body_file})"` |
| `pr_ready` | `gh pr ready {pr}` | `glab mr update {pr} --ready` |
| `ci_status` | `gh pr checks {pr}` | `glab ci status --branch {branch} --compact` |
| `ci_watch` | `gh pr checks {pr} --watch --fail-fast` | `glab ci status --branch {branch} --live` |

Reading results: an empty JSON array from `pr_for_branch` means no PR/MR
exists. `gh pr checks` exits 0 when every check passed, 8 while checks are
pending, 1 when one failed. `glab ci status` encodes the pipeline state in
its output words (`success`, `failed`, `running`, `pending`), not in its
exit code — read the text.

An unknown forge name, or a CLI missing from PATH → push the branch, print
the URL a human would use to open the PR/MR, and return `ci_status:
unknown`. That fails this skill's verify on purpose: the run stops at a gate
instead of pretending.

## Process

1. **Sync with base.** `git fetch origin`, then rebase onto
   `origin/<base>`. A conflict outside the knowledge namespace → stop and
   hand the conflict to the human; do not resolve source conflicts. A
   conflict inside the knowledge namespace is resolved by **keyed union**:
   keep every entry from both sides, matching on the entry's key (`id` for
   taste rows, `path` for registry endpoints, the ADR id for decisions),
   prefer the base side when the same key differs, and list what you merged
   in the body under Brain changes.
2. **Re-verify on the rebased tree.** Run the project's test command fresh
   and capture it to `.orchestrate/verify/pull-request-tests.log`. Red →
   return `ci_status: red` with the failing output as the reason; do not
   push a red branch.
3. **Push** with `git push --force-with-lease origin <branch>`.
   `--force-with-lease` protects commits you did not make; plain `--force`
   is forbidden.
4. **Find or create.** `pr_for_branch`. None → assemble the body (below),
   write it to `.orchestrate/pr-body.md`, then stop for the inline gate:
   show title, body, and reviewers; create as draft only on sign-off.
   Exists → `pr_update_body` with the re-assembled body; no gate.
5. **Wait for CI, bounded.** `ci_watch` with a ceiling of about 15 minutes.
   Green → `pr_ready`, return `ci_status: green`. Red → return
   `ci_status: red` with the failing job name and its log tail as the
   reason. Still pending at the ceiling → return `ci_status: pending`.
6. **Verify.** `pr_view`: head SHA must equal `git rev-parse HEAD`. Mismatch
   means the push did not land or someone else pushed; report it as a
   failure, never as done.

## The body

Every section is filled from a file the run produced. A missing input leaves
its section reading `not run this run`, never blank and never invented.

```markdown
# <story title>

`<branch>` → `<base>` · story: `<stories path>` · origin: `<origin>`

## Acceptance criteria → evidence
| AC | Code | Test | Verify log |
| --- | --- | --- | --- |
| AC1 <text> | src/x.ts:42-58 | tests/x.test.ts 'rejects empty email' | step-4-attempt-1.log · exit 0 |

## Verification
- run-tests: <passed>/<failed> · `<command>`
- smoke-test: <passed> passed · <failed> failed · <untested> untested (<reasons>)
- review-code: <verdict>; findings routed back: <n>
- design-review: <verdict> · coverage <full|partial> (<untested checks>)

## Brain changes — review these; a bad lesson contaminates every later run
- taste/<file>: <+n rows | none>
- registry/<file>: <+n entries | none>
- architecture/decisions: <ids added | none>

## Run
actor <email> · run <id> · attempts per step: <n:k, …> · models: <skill=model, …>
```

Title: the story title, prefixed with the conventional-commit type of the
dominant change (`feat:`, `fix:`, …). Reviewers: `collaboration.pr.reviewers`.

## Output

```yaml
pr_url: https://…
ci_status: green # green | red | pending | unknown
reason: "" # required when red or unknown: failing job + log tail, or what is missing
head: <sha>
```

## Red flags — stop

- Pushing a branch whose fresh test run is red
- `git push --force` without `--force-with-lease`
- Resolving a source-code conflict yourself during the rebase
- A body section written from memory instead of from the run's files
- Creating the PR/MR before the inline gate on first open
- Reporting `green` from the CI tool's summary without reading which checks ran
- Merging, or marking ready while CI is red or pending

## Done

PR/MR exists, head SHA matches local HEAD, `ci_status` is known. Return
`pr_url` and `ci_status`; the orchestrator records `pr_url` on `run_end` and
routes a `red` result into the rework loop.
