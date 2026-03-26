# SeevoMap — AI Research Knowledge Graph

> Interactive visualization and search for 3,073 execution-grounded auto-research records.

## What is SeevoMap?

SeevoMap is the frontend for [BotResearchNet](https://huggingface.co/datasets/akiwatanabe/seevomap-graph) — a community knowledge graph where every node is a real experiment: idea → code → execution → result.

**Live**: [https://huggingface.co/spaces/akiwatanabe/seevomap](https://huggingface.co/spaces/akiwatanabe/seevomap)

## Data Source

The app prefers a bundled `public/map.json` fallback and can also fetch the
latest graph from HuggingFace at runtime:
- **Graph data**: `akiwatanabe/seevomap-graph` (`map.json`, currently 3,073 nodes)
- **Search API**: `akiwatanabe/seevomap` (Gradio Space)

Bundling `public/map.json` keeps the graph usable even when HF fetches fail
because of proxies, CORS, or offline development.

## Quick Start

```bash
npm install
npm run dev:local
npm run build
```

Local preview convention:
- Use `npm run dev:local` for frontend work.
- The dev server is expected to run on port `3456` so changes can be checked
  immediately before any GitHub push.

## Deploy

```bash
# Docker
docker build -t seevomap .
docker run -p 3000:80 seevomap

# Or static: npm run build → serve dist/
```

### GitHub Pages

This repo is configured for GitHub Pages deployment:

1. Make and test changes locally first
2. Run `npm run build` before claiming the site is ready
3. Push `docs-autoresearch-preview` if you want a preview deployment
4. Push or merge to `main` when you want the production site updated
5. In GitHub repo settings, set `Pages` source to `GitHub Actions`

Notes:
- Routing uses `HashRouter`, so deep links work on static GitHub hosting.
- The bundled `public/map.json` fallback is loaded via a relative path, so it
  still works when the site is served from `https://<user>.github.io/<repo>/`.
- During frontend work, rerun the local preview first and check port `3456`
  before treating the change as ready.
- Production deploys are triggered by `.github/workflows/deploy-pages.yml` on
  pushes to `main`.
- Preview deploys are triggered by `.github/workflows/preview-pages.yml` on
  pushes to `docs-autoresearch-preview`.
- The intended workflow is local preview first, GitHub preview second,
  production deploy last.

## CLI & SDK

```bash
pip install seevomap
seevomap search "optimize transformer pretraining" --top-k 10
```

```python
from seevomap import SeevoMap
svm = SeevoMap()
results = svm.search("my task", top_k=5)
```

## Tech Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + Plotly.js

## Links

- [PyPI](https://pypi.org/project/seevomap/) · [HF Space](https://huggingface.co/spaces/akiwatanabe/seevomap) · [HF Dataset](https://huggingface.co/datasets/akiwatanabe/seevomap-graph)
