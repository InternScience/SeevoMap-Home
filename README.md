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
- For a production-like local check, run `npm run build` first and then serve
  the built site locally with `npm run preview -- --host 0.0.0.0 --port 3456`.
- The local site can point at a different backend by setting
  `VITE_SEEVOMAP_SPACE_URL` before starting the dev server or preview server.
- Website sign-in now defaults to the public SeevoMap CIMD client id at
  `https://internscience.github.io/SeevoMap-Home/.well-known/oauth-cimd`.
- `VITE_SEEVOMAP_HF_CLIENT_ID` is now only an optional override if you want to
  point this deployment at a different Hugging Face OAuth app.

Local sign-in setup:

```bash
cp .env.local.example .env.local
```

- Local dev can reuse the default SeevoMap public client id.
- If you keep the default, use one of the already-registered callbacks:
  - `http://127.0.0.1:3456/oauth/callback/huggingface/`
  - `http://localhost:3456/oauth/callback/huggingface/`
  - `http://127.0.0.1:3457/oauth/callback/huggingface/`
  - `http://localhost:3457/oauth/callback/huggingface/`
  - `http://127.0.0.1:3458/oauth/callback/huggingface/`
  - `http://localhost:3458/oauth/callback/huggingface/`
  - `http://127.0.0.1:3459/oauth/callback/huggingface/`
  - `http://localhost:3459/oauth/callback/huggingface/`
- If you want to point the site at a different OAuth app, set
  `VITE_SEEVOMAP_HF_CLIENT_ID` in `.env.local`.

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
seevomap leaderboard --limit 10
```

```python
from seevomap import SeevoMap
svm = SeevoMap()
results = svm.search("my task", top_k=5)
```

The static website now includes a public `/leaderboard` route backed by the
Space API, plus a Search-page flow that creates inject sessions and allows
optional session-bound `helpful / not helpful` feedback.

## Tech Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + Plotly.js

## Links

- [PyPI](https://pypi.org/project/seevomap/) · [HF Space](https://huggingface.co/spaces/akiwatanabe/seevomap) · [HF Dataset](https://huggingface.co/datasets/akiwatanabe/seevomap-graph)
