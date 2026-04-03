import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

test("github pages source assets include the CIMD document", () => {
  const cimdPath = path.join(repoRoot, "public", ".well-known", "oauth-cimd");
  const payload = readFileSync(cimdPath, "utf8");

  assert.ok(payload.includes('"client_id": "https://internscience.github.io/SeevoMap-Home/.well-known/oauth-cimd"'));
  assert.ok(payload.includes('"https://internscience.github.io/SeevoMap-Home/oauth/callback/huggingface/"'));
  assert.ok(payload.includes('"http://127.0.0.1:3457/oauth/callback/huggingface/"'));
  assert.ok(payload.includes('"http://127.0.0.1:3458/oauth/callback/huggingface/"'));
  assert.ok(payload.includes('"http://127.0.0.1:3459/oauth/callback/huggingface/"'));
  assert.ok(payload.includes('"http://localhost:3457/oauth/callback/huggingface/"'));
  assert.ok(payload.includes('"http://localhost:3458/oauth/callback/huggingface/"'));
  assert.ok(payload.includes('"http://localhost:3459/oauth/callback/huggingface/"'));
});

test("github pages source assets include .nojekyll so dotpaths are publishable", () => {
  const noJekyllPath = path.join(repoRoot, "public", ".nojekyll");
  const stat = statSync(noJekyllPath);

  assert.ok(stat.isFile());
});
