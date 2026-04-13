import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOAuthRedirectUri,
  extractOAuthCallbackParams,
  getWebsiteSignInConfigurationMessage,
  isWebsiteSignInConfigured,
  SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID,
} from "../src/auth/oauthBrowser.js";

test("buildOAuthRedirectUri uses the deployed pathname for GitHub Pages", () => {
  assert.equal(
    buildOAuthRedirectUri("https://internscience.github.io", "/SeevoMap-Home/"),
    "https://internscience.github.io/SeevoMap-Home/oauth/callback/huggingface/",
  );
});

test("buildOAuthRedirectUri uses the root path for local development", () => {
  assert.equal(
    buildOAuthRedirectUri("http://localhost:3456", "/"),
    "http://localhost:3456/oauth/callback/huggingface/",
  );
});

test("empty client id disables website sign-in", () => {
  assert.equal(isWebsiteSignInConfigured(""), false);
  assert.equal(isWebsiteSignInConfigured("hf_client_id"), true);
});

test("empty client id surfaces the missing env name and callback uri", () => {
  assert.equal(
    getWebsiteSignInConfigurationMessage("", "http://127.0.0.1:3456", "/"),
    "Set VITE_SEEVOMAP_HF_CLIENT_ID to override website sign-in on this deployment. Default SeevoMap sign-in already uses https://internscience.github.io/SeevoMap-Home/oauth/client-metadata.json. Allow this callback in the Hugging Face OAuth app: http://127.0.0.1:3456/oauth/callback/huggingface/",
  );
});

test("default client id points at the public JSON metadata document", () => {
  assert.equal(
    SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID,
    "https://internscience.github.io/SeevoMap-Home/oauth/client-metadata.json",
  );
});

test("extractOAuthCallbackParams reads query parameters from hash callback routes", () => {
  const params = extractOAuthCallbackParams("", "#/auth/callback?code=abc&state=xyz");
  assert.equal(params.get("code"), "abc");
  assert.equal(params.get("state"), "xyz");
});
