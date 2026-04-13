export const WEBSITE_SIGN_IN_CLIENT_ID_ENV = "VITE_SEEVOMAP_HF_CLIENT_ID";
// GitHub Pages serves the legacy extensionless CIMD asset as application/octet-stream,
// so the default public client id now points at an equivalent JSON metadata document.
export const SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID =
  "https://internscience.github.io/SeevoMap-Home/oauth/client-metadata.json";
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

function isUrlClientId(clientId: string): boolean {
  return /^https?:\/\//i.test(String(clientId || "").trim());
}

export async function assertWebsiteSignInReady(clientId: string): Promise<void> {
  const resolvedClientId = String(clientId || "").trim();
  if (!resolvedClientId || !isUrlClientId(resolvedClientId)) {
    return;
  }

  let response: Response;
  try {
    response = await fetch(resolvedClientId, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Network request failed";
    throw new Error(`Failed to verify OAuth client metadata at ${resolvedClientId}: ${message}`);
  }

  if (!response.ok) {
    if (resolvedClientId === SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID && response.status === 404) {
      throw new Error(
        `The public SeevoMap OAuth metadata is not deployed yet at ${resolvedClientId}. ` +
          `Deploy this branch to GitHub Pages first, or set ${WEBSITE_SIGN_IN_CLIENT_ID_ENV} in .env.local to a working Hugging Face OAuth client id.`,
      );
    }
    throw new Error(
      `OAuth client metadata is unavailable at ${resolvedClientId}: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType && !contentType.toLowerCase().includes("json")) {
    throw new Error(
      `OAuth client metadata at ${resolvedClientId} is served as ${contentType}, not application/json.`,
    );
  }
}
