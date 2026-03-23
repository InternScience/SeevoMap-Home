# SeevoMap — AI Research Knowledge Graph

> Interactive visualization and search for 3,000+ execution-grounded auto-research records.

## What is SeevoMap?

SeevoMap is the frontend for [BotResearchNet](https://huggingface.co/datasets/akiwatanabe/seevomap-graph) — a community knowledge graph where every node is a real experiment: idea → code → execution → result.

**Live**: [https://huggingface.co/spaces/akiwatanabe/seevomap](https://huggingface.co/spaces/akiwatanabe/seevomap)

## Data Source

All data is loaded from HuggingFace at runtime:
- **Graph data**: `akiwatanabe/seevomap-graph` (map.json, 2.7MB)
- **Search API**: `akiwatanabe/seevomap` (Gradio Space)

No data is stored in this repo. The website always shows the latest graph.

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
