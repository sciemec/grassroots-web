#!/usr/bin/env node
/**
 * bump-sw-version.js
 *
 * Replaces the hardcoded CACHE_VERSION string in public/sw.js with a
 * timestamp-based version on every build. This ensures:
 *   1. The SW file bytes change on every deploy.
 *   2. The browser's byte-compare check triggers the update flow.
 *   3. The SW's activate handler deletes old versioned caches.
 *
 * Runs as "prebuild" so it executes before `next build` copies public/
 * into the output directory. The modification is ephemeral — it only
 * exists in the Render build filesystem, never committed to git.
 */

const fs   = require("fs");
const path = require("path");

const swPath  = path.join(__dirname, "..", "public", "sw.js");
const version = `v${Date.now()}`;

let content = fs.readFileSync(swPath, "utf8");

const updated = content.replace(
  /CACHE_VERSION\s*=\s*"[^"]+"/,
  `CACHE_VERSION = "${version}"`
);

if (updated === content) {
  console.error("bump-sw-version: WARNING — CACHE_VERSION pattern not found in sw.js");
  process.exit(1);
}

fs.writeFileSync(swPath, updated, "utf8");
console.log(`bump-sw-version: sw.js CACHE_VERSION set to ${version}`);
