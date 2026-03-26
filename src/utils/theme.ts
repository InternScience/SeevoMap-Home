export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "seevomap-theme";

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}
