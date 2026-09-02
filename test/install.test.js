import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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

  const shipped = readdirSync(new URL("../skills/", import.meta.url), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, new RegExp(`✗ all ${shipped} skills valid`));
  assert.match(result.stdout, /✗ root AGENTS guidance active/);
});

test("install stamps the skills dir with the package version and skill list", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));

  execFileSync(process.execPath, [cli, "install", "--ide", "claude", "--dir", project]);
  const stamp = JSON.parse(readFileSync(join(project, ".claude/skills/.orchestrix-skills.json"), "utf8"));
  const packaged = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(stamp.version, packaged.version);
  assert.equal(stamp.ide, "claude");
  assert.ok(stamp.skills.includes("orchestrate"));
  const packagedSkills = readdirSync(new URL("../skills/", import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.deepEqual(stamp.skills.sort(), packagedSkills.sort());
});

test("reinstall retires skills the package dropped, never foreign ones", (t) => {
  const project = temporaryProject();
  t.after(() => rmSync(project, { recursive: true, force: true }));
  execFileSync(process.execPath, [cli, "install", "--ide", "claude", "--dir", project]);

  const skillsDir = join(project, ".claude/skills");
  const stampPath = join(skillsDir, ".orchestrix-skills.json");
  const stamp = JSON.parse(readFileSync(stampPath, "utf8"));
  // A skill a PREVIOUS version shipped (recorded in the stamp) …
  mkdirSync(join(skillsDir, "retired-skill"), { recursive: true });
  writeFileSync(join(skillsDir, "retired-skill/SKILL.md"), "old\n");
  stamp.skills.push("retired-skill");
  writeFileSync(stampPath, JSON.stringify(stamp));
  // … next to one this package never installed (host- or user-owned).
  mkdirSync(join(skillsDir, "pasty-share"), { recursive: true });
  writeFileSync(join(skillsDir, "pasty-share/SKILL.md"), "foreign\n");

  execFileSync(process.execPath, [cli, "install", "--ide", "claude", "--dir", project]);

  assert.equal(existsSync(join(skillsDir, "retired-skill")), false);
  assert.equal(existsSync(join(skillsDir, "pasty-share")), true);
  assert.equal(JSON.parse(readFileSync(stampPath, "utf8")).skills.includes("retired-skill"), false);
});

test("plugin manifest version tracks package.json", () => {
  // Both ship in the tarball. The manifest has drifted before (it sat at 0.1.0
  // through several releases) because nothing failed when it did.
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const plugin = JSON.parse(readFileSync(new URL("../.claude-plugin/plugin.json", import.meta.url), "utf8"));
  assert.equal(plugin.version, pkg.version);
});

test("the published package carries no private or non-English references", () => {
  // This is an open-source package: a path into someone's private notes is a
  // dead link to every reader, and the docs are English-only by policy.
  const files = [
    "README.md",
    "bin/install.js",
    "skills/README.md",
    "project-scaffold/README.md",
    "skills/commit/SKILL.md",
    "skills/orchestrate/SKILL.md",
  ];
  for (const name of files) {
    const text = readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
    assert.doesNotMatch(text, /\p{Script=Han}/u, `${name} must be English-only`);
    assert.doesNotMatch(text, /cc-plans\//, `${name} references a private design doc`);
  }
});

test("every skill declares a model tier and both adapters resolve all three", () => {
  const tiers = ["frontier", "capable", "cheap"];
  const packagedSkills = readdirSync(new URL("../skills/", import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const name of packagedSkills) {
    const skill = readFileSync(new URL(`../skills/${name}/SKILL.md`, import.meta.url), "utf8");
    const tier = skill.match(/^    model: (\S+)$/m)?.[1];
    assert.ok(tiers.includes(tier), `${name} must declare requires.model as one of ${tiers.join("|")}, got ${tier}`);
  }
  for (const runtime of ["claude", "codex"]) {
    const adapter = JSON.parse(readFileSync(new URL(`../adapters/${runtime}/runtime.json`, import.meta.url), "utf8"));
    assert.deepEqual(Object.keys(adapter.models ?? {}).sort(), [...tiers].sort(), `${runtime} adapter must map every tier`);
  }
});

test("Claude writable skills expose Write", () => {
  for (const name of ["map-codebase", "research"]) {
    const skill = readFileSync(new URL(`../skills/${name}/SKILL.md`, import.meta.url), "utf8");
    assert.match(skill, /^allowed-tools:.*\bWrite\b/m, `${name} must allow its declared filesystem writes`);
  }
});
