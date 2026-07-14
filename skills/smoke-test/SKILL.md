---
name: smoke-test
description: Use when the deliverable is a runnable app or service and its real user flows must be proven working from the OUTSIDE (browser/HTTP/CLI) before acceptance — unit tests passing is not that proof.
license: MIT
allowed-tools: [Read, Bash, Grep, Glob]
metadata:
  contract:
    inputs: [run_instructions, flows, qa_feedback?]
    reads: [registry/app]
    outputs: [smoke_report, verify_evidence]
    authority: "Start and stop the app locally; drive it via browser automation, HTTP, or CLI. Read-only on source. No deploy, no external spend, no mutations outside the app's own local state."
    verify: "self — this skill PRODUCES the acceptance evidence; every flow verdict points at a captured artifact."
    accept:
      when: "never — the evidence feeds final acceptance; it does not replace it."
      timing: deferred
---

# Smoke Test (Prove It Works From the Outside)

Unit tests prove functions; a smoke test proves the PRODUCT. Launch the real
app and walk the real flows the user will walk.

**Core principle:** A flow is "passed" only when you drove it yourself and
captured the evidence. "The tests are green so it probably works" is a claim,
not a smoke test.

## The Iron Law

```
UNTESTED IS NOT PASSED. Every flow ends in exactly one of:
passed (with evidence) | failed (with evidence) | untested (with the reason)
```

## Process

1. **Discover how to run it.** `registry/app` first; else the project's
   manifest (`package.json` scripts, `Makefile`, `README`). If the launch
   method is genuinely undocumented and unguessable, report `untested:
   cannot launch` — do not invent a server.
2. **Launch in the background, capture logs.** Redirect stdout/stderr to
   `.orchestrate/verify/smoke-server.log`. Record the PID. Pick a free port if
   configurable (avoid colliding with anything already running).
3. **Wait for readiness, bounded.** Poll the health endpoint / port / ready
   line for up to ~60s. Not ready → flow verdicts are `failed: app did not
   start`, attach the server log, skip to cleanup.
4. **Exercise EVERY listed flow** with the best driver available, in order of
   fidelity:
   - **Browser automation** (a Playwright/Chrome MCP tool, if available in
     this session) — for UI flows: navigate, interact, assert on rendered
     state, screenshot.
   - **HTTP** (`curl`) — assert status code AND response content (a 200
     serving an error page is a fail; check for a string the flow implies).
   - **CLI** — invoke the command, assert exit code and output.
   Use the highest-fidelity driver the flow needs: an interactive UI flow
   "verified" by curling `/` is `untested`, not `passed`.
5. **Capture evidence per flow** to `.orchestrate/verify/smoke-<flow-slug>.log`
   (the exact command/steps + relevant output tail, or the screenshot path).
6. **ALWAYS clean up** — kill the processes you started (and only those),
   remove temp state you created. Cleanup runs even when flows fail.

## Output: `smoke_report`

```markdown
# Smoke Report — <app> @ <commit>

| Flow | Verdict | Evidence |
|---|---|---|
| signup happy path | passed | .orchestrate/verify/smoke-signup.log |
| checkout | failed — 500 on POST /pay | .orchestrate/verify/smoke-checkout.log |
| admin export | untested — needs OAuth I can't complete | (reason) |

Server log: .orchestrate/verify/smoke-server.log
Started/stopped: <pid(s)>, cleaned up: yes
```

## Red flags — stop

- Reporting `passed` for a flow you did not drive
- A UI flow "verified" with a single `curl /` status check
- Conflating "the app is broken" with "my harness is broken" — say which
- Leaving the server (or any process you spawned) running after the report
- Only testing the happy path when `flows` lists error/edge flows

## Done

Every flow has a verdict + evidence artifact; processes cleaned up. `failed`
and `untested` are honest, valid results — report them verbatim, never rounded
up. The report feeds the orchestrator's verify gate and final acceptance.
