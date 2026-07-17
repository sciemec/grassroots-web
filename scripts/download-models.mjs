#!/usr/bin/env node
/**
 * GRS model downloader — cross-platform (Windows, Mac, Linux).
 * Usage: node scripts/download-models.mjs
 *   OR:  npm run setup:models
 *
 * Downloads AI model files that are too large to commit to git.
 * Files land in public/models/ (already gitignored via /public/models/*.onnx).
 */

import { createWriteStream, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = join(__dirname, "..", "public", "models");

const MODELS = [
  {
    name:    "yolov8n.onnx",
    url:     "https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n.onnx",
    sizeMB:  13,
    purpose: "YOLOv8 nano — person + ball detection for ball_mastery and team testTypes",
  },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

async function download(model) {
  const dest = join(MODELS_DIR, model.name);

  if (existsSync(dest)) {
    console.log(`  ✓ ${model.name} already present — skipping`);
    return;
  }

  console.log(`  ↓ ${model.name} (~${model.sizeMB} MB)`);
  console.log(`    ${model.purpose}`);

  // Follow redirects manually (GitHub releases redirect to CDN)
  let url = model.url;
  let res;
  for (let i = 0; i < 5; i++) {
    res = await fetch(url, { redirect: "manual" });
    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
      url = res.headers.get("location");
      continue;
    }
    break;
  }

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);

  const total     = Number(res.headers.get("content-length") ?? 0);
  let   received  = 0;
  let   lastPrint = 0;

  // Stream to disk with progress dots
  const writer = createWriteStream(dest);
  const reader = res.body.getReader();

  const readable = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) { controller.close(); return; }
      received += value.length;
      if (total && Date.now() - lastPrint > 500) {
        const pct = Math.round((received / total) * 100);
        process.stdout.write(`\r    ${pct}%  ${fmt(received)} / ${fmt(total)}   `);
        lastPrint = Date.now();
      }
      controller.enqueue(value);
    },
  });

  await pipeline(readable, writer);
  process.stdout.write(`\r    100%  ${fmt(received)} — done\n`);
}

// ── main ─────────────────────────────────────────────────────────────────────

mkdirSync(MODELS_DIR, { recursive: true });

console.log("\nGRS model downloader");
console.log("────────────────────");

let failed = 0;
for (const model of MODELS) {
  try {
    await download(model);
  } catch (err) {
    console.error(`  ✗ ${model.name} failed: ${err.message}`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} model(s) failed to download. Run again to retry.`);
  process.exit(1);
} else {
  console.log("\nAll models ready. You can now run: npm run dev\n");
}
