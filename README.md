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
npm run dev
```

## Deploy

```bash
# Docker
docker build -t seevomap .
docker run -p 3000:80 seevomap

# Or static: npm run build → serve dist/
```

### GitHub Pages

This repo is configured for GitHub Pages deployment:

1. Push the repo to `main`
2. In GitHub repo settings, open `Pages`
3. Set `Source` to `GitHub Actions`
4. The workflow in `.github/workflows/deploy-pages.yml` will publish `dist/`

Notes:
- Routing uses `HashRouter`, so deep links work on static GitHub hosting.
- The bundled `public/map.json` fallback is loaded via a relative path, so it
  still works when the site is served from `https://<user>.github.io/<repo>/`.

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
