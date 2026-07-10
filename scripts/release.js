#!/usr/bin/env node
/**
 * scripts/release.js
 *
 * Bump the version (minor +1, e.g. 1.7.0 -> 1.8.0 = "V1.8") and prepend
 * an entry to CHANGELOG.md (Vietnamese, internal) and CHANGELOG.en.md
 * (English, customer-facing) in one command.
 *
 * Usage:
 *   npm run release -- "Mo ta thay doi (VI)" --en="Change description (EN)" [--type=feat|fix|change|docs] [--no-commit]
 *
 * Examples:
 *   npm run release -- "Them trang bao cao ap suat moi" --en="Added new pressure report page" --type=feat
 *   npm run release -- "Fix loi khong luu duoc config telegram" --en="Fixed Telegram config not saving" --type=fix
 *
 * --en is optional. If omitted, only CHANGELOG.md (VI) is updated and a
 * reminder is printed to add the English entry manually.
 *
 * By default the script also runs `git add`, `git commit`, and creates an
 * annotated tag (vX.Y.0) for the release. Pass --no-commit to only update
 * the files and leave committing to you.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PKG_PATH = path.join(ROOT, "package.json");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");
const CHANGELOG_EN_PATH = path.join(ROOT, "CHANGELOG.en.md");
const MARKER = "<!-- release-marker -->";

const TYPE_HEADINGS = {
  feat: "Added",
  add: "Added",
  fix: "Fixed",
  change: "Changed",
  chore: "Changed",
  docs: "Docs",
  remove: "Removed",
};

function parseArgs(argv) {
  const args = argv.slice(2);
  let type = "change";
  let noCommit = false;
  let enDescription = "";
  const words = [];

  for (const arg of args) {
    if (arg.startsWith("--type=")) {
      type = arg.split("=")[1].toLowerCase();
    } else if (arg.startsWith("--en=")) {
      enDescription = arg.slice("--en=".length);
    } else if (arg === "--no-commit") {
      noCommit = true;
    } else {
      words.push(arg);
    }
  }

  return { description: words.join(" ").trim(), enDescription: enDescription.trim(), type, noCommit };
}

function bumpVersion(version) {
  const parts = version.split(".").map((n) => parseInt(n, 10));
  const [major, minor] = parts;
  const nextMinor = minor + 1;
  return {
    next: `${major}.${nextMinor}.0`,
    label: `V${major}.${nextMinor}`,
  };
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function prependChangelogEntry(filePath, label, date, heading, description) {
  const content = fs.readFileSync(filePath, "utf8");
  const entry = `## [${label}] - ${date}\n### ${heading}\n- ${description}\n\n`;

  let updated;
  if (content.includes(MARKER)) {
    updated = content.replace(MARKER, `${MARKER}\n\n${entry.trimEnd()}`);
  } else {
    const lines = content.split("\n");
    lines.splice(1, 0, "", entry.trimEnd());
    updated = lines.join("\n");
  }
  fs.writeFileSync(filePath, updated, "utf8");
}

function main() {
  const { description, enDescription, type, noCommit } = parseArgs(process.argv);

  if (!description) {
    console.error(
      'Thieu mo ta thay doi.\nDung: npm run release -- "Mo ta thay doi (VI)" --en="Change description (EN)" [--type=feat|fix|change|docs]'
    );
    process.exit(1);
  }

  const heading = TYPE_HEADINGS[type] || "Changed";
  const date = todayISO();

  // --- bump package.json version ---
  const pkgRaw = fs.readFileSync(PKG_PATH, "utf8");
  const pkg = JSON.parse(pkgRaw);
  const { next, label } = bumpVersion(pkg.version);

  const versionLineRe = /"version"\s*:\s*"[^"]+"/;
  if (!versionLineRe.test(pkgRaw)) {
    console.error('Khong tim thay truong "version" trong package.json');
    process.exit(1);
  }
  const newPkgRaw = pkgRaw.replace(versionLineRe, `"version": "${next}"`);
  fs.writeFileSync(PKG_PATH, newPkgRaw, "utf8");

  // --- prepend entry to CHANGELOG.md (VI) ---
  prependChangelogEntry(CHANGELOG_PATH, label, date, heading, description);

  // --- prepend entry to CHANGELOG.en.md (EN), if provided ---
  const filesToCommit = ["package.json", "CHANGELOG.md"];
  if (enDescription) {
    prependChangelogEntry(CHANGELOG_EN_PATH, label, date, heading, enDescription);
    filesToCommit.push("CHANGELOG.en.md");
  }

  console.log(`Version: ${pkg.version} -> ${next} (${label})`);
  console.log(`CHANGELOG.md da duoc cap nhat.`);
  if (enDescription) {
    console.log(`CHANGELOG.en.md da duoc cap nhat.`);
  } else {
    console.log(
      `CHANGELOG.en.md CHUA duoc cap nhat (thieu --en="..."). Nho tu bo sung ban tieng Anh sau.`
    );
  }

  if (noCommit) {
    console.log("Bo qua git commit (--no-commit). Nho tu commit/tag thu cong.");
    return;
  }

  try {
    execSync(`git add ${filesToCommit.join(" ")}`, { cwd: ROOT, stdio: "inherit" });
    execSync(`git commit -m "chore(release): ${label} - ${description}"`, {
      cwd: ROOT,
      stdio: "inherit",
    });
    execSync(`git tag -a v${next} -m "${label}: ${description}"`, {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log(`Da commit va tao tag v${next}.`);
    console.log(`Chay "git push && git push --tags" de day len remote.`);
  } catch (err) {
    console.error("Git commit/tag that bai (co the do khong co thay doi nao khac de commit).");
    console.error(err.message);
  }
}

main();
