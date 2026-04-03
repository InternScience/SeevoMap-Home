export const WEBSITE_SIGN_IN_CLIENT_ID_ENV = "VITE_SEEVOMAP_HF_CLIENT_ID";
export const SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID =
  "https://internscience.github.io/SeevoMap-Home/.well-known/oauth-cimd";
export const WEBSITE_OAUTH_CALLBACK_PATH = "/oauth/callback/huggingface/";
export const APP_AUTH_CALLBACK_HASH_ROUTE = "/auth/callback";

function normalizeBasePath(pathname: string): string {
  const resolvedPathname = String(pathname || "/").trim() || "/";
  if (resolvedPathname === "/") {
    return "/";
  }
  const normalizedPathname = resolvedPathname.startsWith("/")
    ? resolvedPathname
    : `/${resolvedPathname}`;
  return normalizedPathname.endsWith("/") ? normalizedPathname : `${normalizedPathname}/`;
}

function joinBasePath(basePath: string, relativePath: string): string {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedRelativePath = String(relativePath || "").replace(/^\/+/, "");
  if (!normalizedRelativePath) {
    return normalizedBasePath;
  }
  return `${normalizedBasePath}${normalizedRelativePath}`;
}

export function isWebsiteSignInConfigured(clientId: string): boolean {
  return Boolean(String(clientId || "").trim());
}

export function buildOAuthRedirectUri(origin: string, pathname: string): string {
  const resolvedOrigin = String(origin || "").trim();
  const redirect = new URL(resolvedOrigin);
  redirect.pathname = joinBasePath(pathname, WEBSITE_OAUTH_CALLBACK_PATH);
  redirect.search = "";
  redirect.hash = "";
  return redirect.toString();
}

export function extractOAuthCallbackParams(search: string, hash: string): URLSearchParams {
  const directSearch = String(search || "").trim();
  if (directSearch) {
    return new URLSearchParams(directSearch.startsWith("?") ? directSearch : `?${directSearch}`);
  }

  const resolvedHash = String(hash || "").trim();
  const queryIndex = resolvedHash.indexOf("?");
  if (queryIndex >= 0) {
    return new URLSearchParams(resolvedHash.slice(queryIndex));
  }
  return new URLSearchParams();
}

export function getWebsiteSignInConfigurationMessage(
  clientId: string,
  origin?: string,
  pathname?: string,
): string | null {
  if (isWebsiteSignInConfigured(clientId)) {
    return null;
  }

  const parts = [
    `Set ${WEBSITE_SIGN_IN_CLIENT_ID_ENV} to override website sign-in on this deployment.`,
    `Default SeevoMap sign-in already uses ${SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID}.`,
  ];

  const resolvedOrigin = String(origin || "").trim();
  if (resolvedOrigin) {
    parts.push(
      `Allow this callback in the Hugging Face OAuth app: ${buildOAuthRedirectUri(resolvedOrigin, pathname || "/")}`,
    );
  }

  return parts.join(" ");
}
