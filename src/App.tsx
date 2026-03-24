import { HashRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";

const HomePage = lazy(() => import("./pages/HomePage"));
const GraphPage = lazy(() => import("./pages/GraphPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));

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
  return (
    <HashRouter>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/guide" element={<GuidePage />} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}
