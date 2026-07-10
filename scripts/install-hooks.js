#!/usr/bin/env node
/**
 * scripts/install-hooks.js
 *
 * Copies tracked hook templates from scripts/hooks/ into .git/hooks/ and
 * makes them executable. Git hooks live in .git/hooks (not versioned by
 * git), so every clone/collaborator needs to run this once:
 *
 *   npm run hooks:install
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "scripts", "hooks");
const DEST_DIR = path.join(ROOT, ".git", "hooks");

if (!fs.existsSync(DEST_DIR)) {
  console.error("Khong tim thay .git/hooks - script nay phai chay trong mot git repo.");
  process.exit(1);
}

for (const file of fs.readdirSync(SRC_DIR)) {
  const src = path.join(SRC_DIR, file);
  const dest = path.join(DEST_DIR, file);
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, 0o755);
  console.log(`Da cai hook: ${file}`);
}

console.log("Xong. Tu commit tiep theo se thay nhac nho tu hook.");
