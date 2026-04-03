import {
  HF_OAUTH_AUTHORIZE_URL,
  HF_OAUTH_CLIENT_ID,
  HF_OAUTH_TOKEN_URL,
} from "../config";
import {
  APP_AUTH_CALLBACK_HASH_ROUTE,
  buildOAuthRedirectUri,
  extractOAuthCallbackParams,
  isWebsiteSignInConfigured,
} from "./oauthBrowser";

const OAUTH_STATE_KEY = "seevomap.hf.oauth_state";
const OAUTH_CODE_VERIFIER_KEY = "seevomap.hf.code_verifier";
const POST_AUTH_PATH_KEY = "seevomap.hf.post_auth_path";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomString(length = 64): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

async function codeChallengeFor(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64UrlEncode(new Uint8Array(digest));
}

export function currentAppPath(): string {
  if (typeof window === "undefined") return "/";
  const hashPath = window.location.hash.replace(/^#/, "");
  return hashPath || "/";
}

export function getOAuthRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return buildOAuthRedirectUri(window.location.origin, window.location.pathname);
}

export async function startHfLogin(nextPath = currentAppPath()): Promise<void> {
  if (!isWebsiteSignInConfigured(HF_OAUTH_CLIENT_ID)) {
    throw new Error(
      "Website sign-in is unavailable because no Hugging Face OAuth client id could be resolved. " +
        "Use the default CIMD client id or provide VITE_SEEVOMAP_HF_CLIENT_ID as an override.",
    );
  }

  const state = randomString(32);
  const verifier = randomString(64);
  const challenge = await codeChallengeFor(verifier);
  const redirectUri = getOAuthRedirectUri();

  window.sessionStorage.setItem(OAUTH_STATE_KEY, state);
  window.sessionStorage.setItem(OAUTH_CODE_VERIFIER_KEY, verifier);
  window.sessionStorage.setItem(POST_AUTH_PATH_KEY, nextPath || "/");

  const url = new URL(HF_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", HF_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);

  window.location.assign(url.toString());
}

function consumeSessionValue(key: string): string {
  const value = window.sessionStorage.getItem(key) || "";
  window.sessionStorage.removeItem(key);
  return value;
}

export function clearPendingHfLogin(): void {
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);
  window.sessionStorage.removeItem(POST_AUTH_PATH_KEY);
}

export async function finishHfLogin(): Promise<{
  accessToken: string;
  returnPath: string;
}> {
  const params = extractOAuthCallbackParams(window.location.search, window.location.hash);
  const error = params.get("error");
  const errorDescription = params.get("error_description");
  if (error) {
    clearPendingHfLogin();
    throw new Error(errorDescription || `Hugging Face sign-in failed: ${error}`);
  }

  const code = params.get("code") || "";
  const returnedState = params.get("state") || "";
  const expectedState = consumeSessionValue(OAUTH_STATE_KEY);
  const verifier = consumeSessionValue(OAUTH_CODE_VERIFIER_KEY);
  const returnPath = consumeSessionValue(POST_AUTH_PATH_KEY) || "/account";

  if (!code) {
    throw new Error("Missing OAuth authorization code");
  }
  if (!expectedState || returnedState !== expectedState) {
    throw new Error("OAuth state mismatch");
  }
  if (!verifier) {
    throw new Error("Missing OAuth PKCE verifier");
  }

  const body = new URLSearchParams({
    client_id: HF_OAUTH_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getOAuthRedirectUri(),
    code_verifier: verifier,
  });

  const response = await fetch(HF_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const payload = await response.json();
  if (!response.ok) {
    const description =
      typeof payload?.error_description === "string" && payload.error_description.trim()
        ? payload.error_description
        : typeof payload?.error === "string" && payload.error.trim()
          ? payload.error
          : "Token exchange failed";
    throw new Error(description);
  }

  const accessToken =
    typeof payload?.access_token === "string" && payload.access_token.trim()
      ? payload.access_token
      : "";
  if (!accessToken) {
    throw new Error("OAuth token exchange did not return an access token");
  }

  window.history.replaceState({}, document.title, `${window.location.pathname}#${APP_AUTH_CALLBACK_HASH_ROUTE}`);
  return { accessToken, returnPath };
}
