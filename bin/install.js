#!/usr/bin/env node
// orchestrix-skills installer — zero dependencies.
// Free path: copy skills into the runtime's skills dir + scaffold knowledge/.
// No MCP, no license. Premium (hosted orchestrator / KB / 建造中心) is a separate opt-in.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANAGED_START = "<!-- orchestrix:start -->";
const MANAGED_END = "<!-- orchestrix:end -->";
// Written into the skills dir after every successful install. Two consumers:
// this installer (prunes skills it placed that the package no longer ships) and
// hosts that auto-upgrade projects (compare `version` against the npm dist-tag
// to decide whether to reinstall — no second version constant to maintain).
const STAMP = ".orchestrix-skills.json";

// Where each runtime auto-loads skills from (relative to the target project).
function adapter(name) {
  return JSON.parse(readFileSync(join(PKG, "adapters", name, "runtime.json"), "utf8"));
}

const RUNTIMES = {
  claude: adapter("claude"),
  codex: adapter("codex"),
  // Cursor / Windsurf don't auto-load Anthropic skills; they read rule files.
  // For those, skills are copied as reference rules (best-effort) until native support lands.
  cursor: { skillsDir: ".cursor/rules/orchestrix", nativeSkills: false },
  windsurf: { skillsDir: ".windsurf/rules/orchestrix", nativeSkills: false },
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function help() {
  console.log(`orchestrix-skills — capability-first AI dev skill graph

Usage:
  npx orchestrix-skills install [--ide claude|codex|cursor|windsurf] [--dir <project>]
  npx orchestrix-skills doctor  [--ide claude|codex|cursor|windsurf] [--dir <project>]

What it does (free, no license):
  1. Copies the skills into your runtime's skills dir (default: .claude/skills/)
  2. Scaffolds knowledge/ + core-config.yaml (never overwrites an existing brain)

Premium (hosted orchestrator, KB hosting, teams, 建造中心):
  see https://orchestrix-mcp.youlidao.ai`);
}

function transformSkill(source, runtime) {
  if (runtime !== "codex") return source;
  return source
    .replace(/^allowed-tools:.*\n/m, "")
    .replace(
      /^(---\n\n# )/m,
      "---\n\n<!-- Codex adapter: tool access is governed by the active session. Map metadata.requires capabilities to available tools. -->\n\n# ",
    );
}

function packageVersion() {
  return JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")).version;
}

function readStamp(target) {
  try {
    return JSON.parse(readFileSync(join(target, STAMP), "utf8"));
  } catch {
    return null; // absent, or written by a version that predates stamping
  }
}

function installSkills(dir, runtimeName, runtime) {
  const target = join(dir, runtime.skillsDir);
  mkdirSync(target, { recursive: true });
  const previous = readStamp(target);
  const entries = readdirSync(join(PKG, "skills"), { withFileTypes: true });
  for (const entry of entries) {
    const source = join(PKG, "skills", entry.name);
    const destination = join(target, entry.name);
    if (!entry.isDirectory()) {
      cpSync(source, destination);
      continue;
    }
    mkdirSync(destination, { recursive: true });
    for (const file of readdirSync(source, { withFileTypes: true })) {
      if (file.isFile() && file.name === "SKILL.md") {
        writeFileSync(join(destination, file.name), transformSkill(readFileSync(join(source, file.name), "utf8"), runtimeName));
      } else {
        cpSync(join(source, file.name), join(destination, file.name), { recursive: true });
      }
    }
  }

  const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  // Retire skills a PREVIOUS install of this package placed that it no longer
  // ships. Only names recorded in our own stamp are candidates, so a skill the
  // project or its host installed alongside ours is never touched.
  let pruned = 0;
  for (const name of previous?.skills ?? []) {
    if (names.includes(name)) continue;
    const stale = join(target, name);
    if (!isDirectory(stale)) continue;
    rmSync(stale, { recursive: true, force: true });
    pruned += 1;
  }
  // Stamp LAST: a crash mid-copy leaves the older stamp in place, so the next
  // run still sees a mismatch and reinstalls rather than declaring itself current.
  writeFileSync(
    join(target, STAMP),
    `${JSON.stringify({ version: packageVersion(), ide: runtimeName, skills: names }, null, 2)}\n`,
  );
  return { count: names.length, pruned };
}

function installRuntimeGuidance(dir, runtimeName) {
  if (runtimeName !== "codex") return;
  const source = join(PKG, "adapters", "codex", "AGENTS.md");
  const rootInstructions = join(dir, "AGENTS.md");
  const referenceTarget = join(dir, ".codex", "orchestrix", "AGENTS.md");
  mkdirSync(dirname(referenceTarget), { recursive: true });
  cpSync(source, referenceTarget);
  const guidance = readFileSync(source, "utf8");
  if (!existsSync(rootInstructions)) {
    writeFileSync(rootInstructions, guidance);
    console.log("✓ AGENTS.md created with Codex runtime guidance");
  } else {
    const current = readFileSync(rootInstructions, "utf8");
    const start = current.indexOf(MANAGED_START);
    const end = current.indexOf(MANAGED_END);
    if (start !== -1 && end > start) {
      const updated = `${current.slice(0, start)}${guidance.trimEnd()}${current.slice(end + MANAGED_END.length)}`;
      writeFileSync(rootInstructions, updated);
      console.log("✓ Orchestrix block refreshed in AGENTS.md");
    } else {
      console.log("• AGENTS.md exists — left untouched; merge .codex/orchestrix/AGENTS.md to activate guidance");
    }
  }
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function nonemptyFile(path) {
  return isFile(path) && readFileSync(path, "utf8").trim().length > 0;
}

function validSkill(path, runtimeName, expectedName) {
  if (!nonemptyFile(path)) return false;
  const content = readFileSync(path, "utf8");
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return false;
  if (!new RegExp(`^name:\\s*${expectedName}\\s*$`, "m").test(frontmatter[1])) return false;
  if (!/^description:\s*\S.+$/m.test(frontmatter[1])) return false;
  return runtimeName !== "codex" || !/^allowed-tools:/m.test(frontmatter[1]);
}

function install() {
  const ide = arg("ide", "claude");
  const dir = arg("dir", process.cwd());
  const runtime = RUNTIMES[ide];
  if (!runtime) {
    console.error(`Unknown --ide "${ide}". Options: ${Object.keys(RUNTIMES).join(", ")}`);
    process.exit(1);
  }

  // 1. Skills (capabilities) — always refreshed.
  const { count, pruned } = installSkills(dir, ide, runtime);
  console.log(`✓ ${count} skills → ${runtime.skillsDir}/ (v${packageVersion()})`);
  if (pruned > 0) console.log(`✓ ${pruned} retired skill(s) removed`);
  installRuntimeGuidance(dir, ide);

  // 2. Knowledge (the brain) — scaffold only if absent; never clobber the user's brain.
  const knowledgeTarget = join(dir, "knowledge");
  if (existsSync(knowledgeTarget)) {
    console.log("• knowledge/ exists — left untouched (your brain is yours)");
  } else {
    cpSync(join(PKG, "project-scaffold", "knowledge"), knowledgeTarget, { recursive: true });
    console.log("✓ knowledge/ scaffolded (taste / architecture / registry)");
  }

  // 3. core-config — namespace → path mapping; scaffold only if absent.
  const cfgTarget = join(dir, "core-config.yaml");
  if (existsSync(cfgTarget)) {
    console.log("• core-config.yaml exists — left untouched");
  } else {
    cpSync(join(PKG, "project-scaffold", "core-config.yaml"), cfgTarget);
    console.log("✓ core-config.yaml scaffolded");
  }

  if (ide === "cursor" || ide === "windsurf") {
    console.log(`\nNote: ${ide} does not auto-load Anthropic skills yet — copied as reference rules.`);
  }
  console.log(`\nDone. Start with the "orchestrate" skill. Premium hosting: https://orchestrix-mcp.youlidao.ai`);
}

function doctor() {
  const ide = arg("ide", "claude");
  const dir = arg("dir", process.cwd());
  const runtime = RUNTIMES[ide];
  if (!runtime) {
    console.error(`Unknown --ide "${ide}". Options: ${Object.keys(RUNTIMES).join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const skillsTarget = join(dir, runtime.skillsDir);
  const expectedSkills = readdirSync(join(PKG, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const configPath = join(dir, "core-config.yaml");
  const configContent = nonemptyFile(configPath) ? readFileSync(configPath, "utf8") : "";
  const checks = [
    ["skills directory", isDirectory(skillsTarget), skillsTarget],
    [
      `all ${expectedSkills.length} skills valid`,
      expectedSkills.every((name) => validSkill(join(skillsTarget, name, "SKILL.md"), ide, name)),
      skillsTarget,
    ],
    ["core config valid", /(^|\n)knowledge:\s*(#.*)?\n/.test(configContent) && /(^|\n)work:\s*(#.*)?\n/.test(configContent), configPath],
    ["knowledge brain", isDirectory(join(dir, "knowledge")), join(dir, "knowledge")],
  ];
  if (ide === "codex") {
    const reference = join(dir, ".codex", "orchestrix", "AGENTS.md");
    const rootInstructions = join(dir, "AGENTS.md");
    const referenceContent = nonemptyFile(reference) ? readFileSync(reference, "utf8") : "";
    const rootContent = nonemptyFile(rootInstructions) ? readFileSync(rootInstructions, "utf8") : "";
    checks.push(["Codex guidance reference", referenceContent.includes(MANAGED_START) && referenceContent.includes(MANAGED_END), reference]);
    checks.push(["root AGENTS guidance active", rootContent.includes(MANAGED_START) && rootContent.includes(MANAGED_END), rootInstructions]);
  }
  let healthy = true;
  for (const [label, ok, path] of checks) {
    healthy &&= ok;
    console.log(`${ok ? "✓" : "✗"} ${label}: ${path}`);
  }
  if (healthy) console.log(`\nHealthy: ${ide} installation is complete.`);
  else {
    console.error(`\nUnhealthy: run "orchestrix-skills install --ide ${ide} --dir ${dir}".`);
    process.exitCode = 1;
  }
}

const cmd = process.argv[2];
if (cmd === "install") install();
else if (cmd === "doctor") doctor();
else help();
