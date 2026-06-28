#!/usr/bin/env node
// orchestrix-skills installer — zero dependencies.
// Free path: copy skills into the runtime's skills dir + scaffold knowledge/.
// No MCP, no license. Premium (hosted orchestrator / KB / 建造中心) is a separate opt-in.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");

// Where each runtime auto-loads skills from (relative to the target project).
const IDE_SKILLS_DIR = {
  claude: ".claude/skills",
  codex: ".codex/skills",
  // Cursor / Windsurf don't auto-load Anthropic skills; they read rule files.
  // For those, skills are copied as reference rules (best-effort) until native support lands.
  cursor: ".cursor/rules/orchestrix",
  windsurf: ".windsurf/rules/orchestrix",
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function help() {
  console.log(`orchestrix-skills — capability-first AI dev skill graph

Usage:
  npx orchestrix-skills install [--ide claude|codex|cursor|windsurf] [--dir <project>]

What it does (free, no license):
  1. Copies the skills into your runtime's skills dir (default: .claude/skills/)
  2. Scaffolds knowledge/ + core-config.yaml (never overwrites an existing brain)

Premium (hosted orchestrator, KB hosting, teams, 建造中心):
  see https://orchestrix-mcp.youlidao.ai`);
}

function install() {
  const ide = arg("ide", "claude");
  const dir = arg("dir", process.cwd());
  const rel = IDE_SKILLS_DIR[ide];
  if (!rel) {
    console.error(`Unknown --ide "${ide}". Options: ${Object.keys(IDE_SKILLS_DIR).join(", ")}`);
    process.exit(1);
  }

  // 1. Skills (capabilities) — always refreshed.
  const skillsTarget = join(dir, rel);
  mkdirSync(skillsTarget, { recursive: true });
  cpSync(join(PKG, "skills"), skillsTarget, { recursive: true });
  const count = readdirSync(join(PKG, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory()).length;
  console.log(`✓ ${count} skills → ${rel}/`);

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

const cmd = process.argv[2];
if (cmd === "install") install();
else help();
