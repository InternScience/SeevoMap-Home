import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getGraphLabel } from "../config";
import type { ThemeMode } from "../utils/theme";
import GraphSelector from "./GraphSelector";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/graph", label: "Graph" },
  { to: "/search", label: "Market" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/docs", label: "Docs" },
];

interface NavbarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const location = useLocation();
  const {
    canSignIn,
    graphs,
    isAuthenticated,
    principal,
    selectedGraphId,
    setSelectedGraphId,
    signInConfigurationMessage,
    signIn,
  } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nextThemeLabel = theme === "dark" ? "Light" : "Dark";
  const activePath = location.pathname || "/";
  const canSwitchGraphs = graphs.length > 1;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
            <span className="text-text-primary">Se</span>
            <span className="brand-evo">evo</span>
            <span className="text-text-primary">Map</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map((link) => {
              const isActive = link.to === "/docs"
                ? location.pathname === "/docs" || location.pathname.startsWith("/docs/")
                : location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 ${
                    isActive
                      ? "text-emerald-primary"
                      : "text-text-secondary hover:text-text-primary surface-hover"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-primary rounded-full" />
                  )}
                </Link>
              );
            })}
            {canSwitchGraphs ? (
              <GraphSelector
                graphs={graphs}
                selectedGraphId={selectedGraphId}
                onChange={setSelectedGraphId}
              />
            ) : (
              <span className="hidden lg:inline-flex rounded-xl border border-border-subtle px-3 py-2 text-sm text-text-secondary">
                {getGraphLabel(selectedGraphId)}
              </span>
            )}
            {isAuthenticated ? (
              <Link
                to="/account"
                className="relative px-4 py-2 text-sm font-medium rounded-xl text-text-secondary hover:text-text-primary surface-hover"
              >
                @{principal.hf_username || principal.user_id}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void signIn(activePath)}
                disabled={!canSignIn}
                title={canSignIn ? "Sign in with Hugging Face" : signInConfigurationMessage || "Sign-in is not configured on this deployment"}
                className="relative px-4 py-2 text-sm font-medium rounded-xl text-text-secondary hover:text-text-primary surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
              className="theme-toggle ml-2"
              aria-label={`Switch to ${nextThemeLabel} mode`}
              title={`Switch to ${nextThemeLabel} mode`}
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2.25m0 13.5V21m6.364-15.364l-1.591 1.591M7.227 16.773l-1.591 1.591M21 12h-2.25M5.25 12H3m15.364 6.364l-1.591-1.591M7.227 7.227 5.636 5.636M15.75 12A3.75 3.75 0 1112 8.25 3.75 3.75 0 0115.75 12z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12.79A9 9 0 1111.21 3c0 .47.033.93.097 1.384a7.5 7.5 0 009.693 9.309z" />
                </svg>
              )}
              <span className="text-sm font-medium">{nextThemeLabel}</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary surface-hover transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-subtle">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.to === "/docs"
                ? location.pathname === "/docs" || location.pathname.startsWith("/docs/")
                : location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-emerald-primary bg-emerald-primary/5"
                      : "text-text-secondary hover:text-text-primary surface-hover"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {canSwitchGraphs ? (
              <div className="px-3 py-2">
                <GraphSelector
                  graphs={graphs}
                  selectedGraphId={selectedGraphId}
                  onChange={(graphId) => {
                    setSelectedGraphId(graphId);
                    setMobileOpen(false);
                  }}
                />
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-text-secondary">
                {getGraphLabel(selectedGraphId)}
              </div>
            )}
            {isAuthenticated ? (
              <Link
                to="/account"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary surface-hover"
              >
                @{principal.hf_username || principal.user_id}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void signIn(activePath);
                }}
                disabled={!canSignIn}
                title={canSignIn ? "Sign in with Hugging Face" : signInConfigurationMessage || "Sign-in is not configured on this deployment"}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onToggleTheme();
                setMobileOpen(false);
              }}
              className="theme-toggle mt-2 w-full justify-center"
              aria-label={`Switch to ${nextThemeLabel} mode`}
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2.25m0 13.5V21m6.364-15.364l-1.591 1.591M7.227 16.773l-1.591 1.591M21 12h-2.25M5.25 12H3m15.364 6.364l-1.591-1.591M7.227 7.227 5.636 5.636M15.75 12A3.75 3.75 0 1112 8.25 3.75 3.75 0 0115.75 12z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12.79A9 9 0 1111.21 3c0 .47.033.93.097 1.384a7.5 7.5 0 009.693 9.309z" />
                </svg>
              )}
              <span className="text-sm font-medium">{nextThemeLabel}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
