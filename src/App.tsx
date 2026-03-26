import { HashRouter, Navigate, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import {
  getInitialTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "./utils/theme";

const HomePage = lazy(() => import("./pages/HomePage"));
const GraphPage = lazy(() => import("./pages/GraphPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const QuickstartPage = lazy(() => import("./pages/QuickstartPage"));
const AutoresearchPage = lazy(() => import("./pages/AutoresearchPage"));
const ParameterGolfPage = lazy(() => import("./pages/ParameterGolfPage"));
const ReferencePage = lazy(() => import("./pages/ReferencePage"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const initial = getInitialTheme();
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = initial;
      document.documentElement.style.colorScheme = initial;
    }
    return initial;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <HashRouter>
      <div className="app-shell min-h-screen">
        <Navbar
          theme={theme}
          onToggleTheme={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
        />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/guide" element={<Navigate to="/docs" replace />} />
            <Route path="/docs" element={<GuidePage />} />
            <Route path="/docs/quickstart" element={<QuickstartPage />} />
            <Route path="/docs/integration" element={<AutoresearchPage />} />
            <Route path="/docs/parameter-golf" element={<ParameterGolfPage />} />
            <Route path="/docs/reference" element={<ReferencePage />} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}
