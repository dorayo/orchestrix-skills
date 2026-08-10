import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const cli = new URL("../bin/install.js", import.meta.url).pathname;

function temporaryProject() {
  return mkdtempSync(join(tmpdir(), "orchestrix-install-"));
}

test("Codex install transforms skills and passes doctor", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));

  execFileSync(process.execPath, [cli, "install", "--ide", "codex", "--dir", project]);
  const skill = readFileSync(join(project, ".codex/skills/orchestrate/SKILL.md"), "utf8");

  assert.doesNotMatch(skill, /^allowed-tools:/m);
  assert.match(skill, /metadata:\n/);
  assert.match(skill, /Codex adapter:/);
  assert.match(readFileSync(join(project, "AGENTS.md"), "utf8"), /Orchestrix runtime guidance/);

  const result = spawnSync(process.execPath, [cli, "doctor", "--ide", "codex", "--dir", project], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Healthy: codex installation is complete/);
});

test("Codex install never overwrites an existing AGENTS.md", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));
  writeFileSync(join(project, "AGENTS.md"), "user-owned\n");

  execFileSync(process.execPath, [cli, "install", "--ide", "codex", "--dir", project]);

  assert.equal(readFileSync(join(project, "AGENTS.md"), "utf8"), "user-owned\n");
  assert.match(readFileSync(join(project, ".codex/orchestrix/AGENTS.md"), "utf8"), /Orchestrix runtime guidance/);
});

test("Codex reinstall refreshes only its managed AGENTS block", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));
  execFileSync(process.execPath, [cli, "install", "--ide", "codex", "--dir", project]);
  const instructions = join(project, "AGENTS.md");
  const oldBlock = readFileSync(instructions, "utf8").replace("# Orchestrix runtime guidance", "# stale guidance");
  writeFileSync(instructions, `user prefix\n${oldBlock.trim()}\nuser suffix\n`);

  execFileSync(process.execPath, [cli, "install", "--ide", "codex", "--dir", project]);
  const refreshed = readFileSync(instructions, "utf8");

  assert.match(refreshed, /^user prefix/m);
  assert.match(refreshed, /# Orchestrix runtime guidance/);
  assert.doesNotMatch(refreshed, /stale guidance/);
  assert.match(refreshed, /user suffix$/m);
});

test("Claude install retains Anthropic allowed-tools", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));

  execFileSync(process.execPath, [cli, "install", "--ide", "claude", "--dir", project]);
  const skill = readFileSync(join(project, ".claude/skills/orchestrate/SKILL.md"), "utf8");

  assert.match(skill, /^allowed-tools:/m);
  assert.doesNotMatch(skill, /Codex adapter:/);
});

test("doctor fails for an incomplete install", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));

  const result = spawnSync(process.execPath, [cli, "doctor", "--ide", "codex", "--dir", project], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unhealthy:/);
});

test("doctor rejects corrupt skills and inactive Codex guidance", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));
  execFileSync(process.execPath, [cli, "install", "--ide", "codex", "--dir", project]);
  writeFileSync(join(project, ".codex/skills/orchestrate/SKILL.md"), "");
  writeFileSync(join(project, "AGENTS.md"), "user-only\n");

  const result = spawnSync(process.execPath, [cli, "doctor", "--ide", "codex", "--dir", project], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /✗ all 16 skills valid/);
  assert.match(result.stdout, /✗ root AGENTS guidance active/);
});

test("Claude writable skills expose Write", () => {
  for (const name of ["map-codebase", "research"]) {
    const skill = readFileSync(new URL(`../skills/${name}/SKILL.md`, import.meta.url), "utf8");
    assert.match(skill, /^allowed-tools:.*\bWrite\b/m, `${name} must allow its declared filesystem writes`);
  }
});
