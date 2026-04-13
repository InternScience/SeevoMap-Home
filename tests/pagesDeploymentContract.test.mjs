import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

test("github pages source assets include the OAuth client metadata document", () => {
  const metadataPath = path.join(repoRoot, "public", "oauth", "client-metadata.json");
  const payload = readFileSync(metadataPath, "utf8");

  assert.ok(payload.includes('"client_id": "https://internscience.github.io/SeevoMap-Home/oauth/client-metadata.json"'));
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

test("github pages deploy tracks the offline leaderboard fixture", () => {
  const fixturePath = path.join(repoRoot, "public", "generated", "offline_quality_fixture.json");
  const stat = statSync(fixturePath);
  const payload = readFileSync(fixturePath, "utf8");

  assert.ok(stat.isFile());
  assert.ok(payload.includes('"model_leaderboard"'));
  assert.ok(payload.includes('"node_leaderboard"'));
});
