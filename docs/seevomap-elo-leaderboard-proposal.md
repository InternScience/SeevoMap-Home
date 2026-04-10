# SeevoMap ELO Leaderboard：基于科研基因调用的模型能力排行榜方案

> **项目**: SeevoMap — AI Research Knowledge Graph  
> **目标**: 利用 SeevoMap 知识图谱中的科研执行记录（"科研基因"），构建一个 ELO 排行榜，客观反映不同 LLM 模型在自动化科研任务中的能力强弱。  
> **日期**: 2025-07

---

## 一、背景与动机

### 1.1 SeevoMap 现状

SeevoMap 是一个包含 **4,279 条执行记录**（execution records）和 **21,365 条关系边**的 AI 科研知识图谱。每条记录（"科研基因"）包含：

| 字段 | 说明 | 示例 |
|------|------|------|
| `model` | 产生该基因的 LLM 模型 | `claude_4_5_opus`, `gpt5`, `deepseek-v3` |
| `task_name` | 任务名称 | `nanogpt-speedrun`, `grpo-math`, `ScivBook/IdeaMiner` |
| `metric_name` | 评测指标名 | `val_loss`, `accuracy`, `novelty_score` |
| `metric_value` | 评测指标值 | `3.1407`, `0.616`, `8.83` |
| `success` | 实验是否成功 | `true` / `false` |
| `idea` | 实验思路描述 | `[Experiment] Wider SwiGLU (5x) with...` |
| `method_tags` | 方法标签 | `["architecture", "optimization"]` |
| `source` | 来源 | `Automated-AI-Researcher/claude_opus_nanogpt` |

### 1.2 现有数据中的模型分布

当前图谱中的 **四大主力模型** 及其记录量：

| 模型 | 记录数 | 涉及任务 |
|------|--------|---------|
| `deepseek-v3` | 1,200 | ScivBook/IdeaMiner（科研假说生成） |
| `claude_4_5_opus` | 1,139 | nanogpt-speedrun, grpo-math（代码优化） |
| `claude_4_5_sonnet` | 992 | nanogpt-speedrun, grpo-math（代码优化） |
| `gpt5` | 902 | nanogpt-speedrun, grpo-math（代码优化） |

此外还有 ~40 条来自社区提交的人类/其他模型记录，以及 19 条 ResearchClawBench 评测记录。

### 1.3 为什么需要 ELO 排行榜

1. **现有 Benchmark 缺陷**: 传统 benchmark（如 MMLU、HumanEval）只测"知道什么"，不测"能做什么"。SeevoMap 里的数据是**真实执行记录**——含代码改动、实际指标、成功/失败分析。
2. **用户选择困难**: 当用户调用 `seevomap inject` 获取社区经验时，返回的结果来自不同模型。用户需要知道"哪个模型的科研基因更可靠"。
3. **社区激励**: 排行榜让贡献高质量记录的模型/研究者可见，形成正反馈循环。
4. **与 ResearchClawBench 互补**: ResearchClawBench 定义了评测任务（`checklist_score`），SeevoMap ELO 可以作为其上层排名机制。

---

## 二、核心设计：多维 ELO 排名系统

### 2.1 总体架构

```
┌──────────────────────────────────────────────────────────────┐
│                    SeevoMap ELO Leaderboard                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Arena ELO │  │ Task ELO │  │ Retrieve │  │ Composite│    │
│  │ (对战制)  │  │ (指标制) │  │ ELO      │  │ Score    │    │
│  │          │  │          │  │ (调用制) │  │ (综合分) │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │              │           │
│       ▼             ▼             ▼              ▼           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SeevoMap Knowledge Graph                │    │
│  │  4,279 nodes · 21,365 edges · model field per node  │    │
│  └─────────────────────────────────────────────────────┘    │
│       ▲             ▲             ▲                          │
│       │             │             │                          │
│  ┌────┴──┐    ┌────┴──┐    ┌────┴──────┐                   │
│  │submit │    │inject │    │search/run │                    │
│  │ API   │    │ API   │    │ API       │                    │
│  └───────┘    └───────┘    └───────────┘                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 三条 ELO 赛道

我们设计 **三条独立的 ELO 赛道**，最终融合为一个综合排名：

---

#### 赛道 A：Arena ELO（对战制 — 核心赛道）

**原理**: 借鉴 [Chatbot Arena](https://arena.lmsys.org/) 的对战 ELO 思路，但以**科研执行结果**为胜负依据，而非人类偏好投票。

**对战构造方法**:

```
对于同一 task_name 下不同 model 的两条记录 (node_A, node_B)：
  - 如果 task 是 minimize 类型 (如 val_loss)：
      metric_value 更低者 → 胜
  - 如果 task 是 maximize 类型 (如 accuracy)：
      metric_value 更高者 → 胜
  - 平局条件：|diff| < threshold (如 0.5%)
```

**ELO 更新公式**:

```
E_A = 1 / (1 + 10^((R_B - R_A) / 400))    # A 的预期胜率
S_A = 1 (胜) / 0.5 (平) / 0 (负)
R_A_new = R_A + K × (S_A - E_A)

K 值策略：
  K = 32  (新模型, < 50 场对战)
  K = 16  (成熟模型, ≥ 50 场对战)
```

**当前可构造的对战数据**:

| 任务 | 模型对 | 可构造对战数（估） | 判定标准 |
|------|--------|------------------|---------|
| nanogpt-speedrun | opus vs sonnet vs gpt5 | ~300K+ | lower val_loss wins |
| grpo-math | opus vs sonnet vs gpt5 | ~150K+ | higher accuracy wins |
| ScivBook/IdeaMiner | deepseek-v3 vs (future) | 待扩展 | higher novelty_score wins |
| ResearchClawBench | 多模型 | ~19 条 | higher checklist_score wins |

**对战采样策略**（避免数据量不平衡带来的偏差）：

```python
def sample_matchups(nodes, task_name, n_matches=10000):
    """在同一任务下，随机采样跨模型对战"""
    task_nodes = [n for n in nodes if n['task_name'] == task_name]
    models = set(n['model'] for n in task_nodes)
    model_nodes = {m: [n for n in task_nodes if n['model'] == m] for m in models}
    
    matchups = []
    for _ in range(n_matches):
        m1, m2 = random.sample(list(models), 2)
        n1 = random.choice(model_nodes[m1])
        n2 = random.choice(model_nodes[m2])
        matchups.append((n1, n2))
    return matchups
```

**关键设计决策**:

- **同任务对战**: 只在相同 `task_name` 内对战，确保公平性
- **Bootstrap 采样**: 每次更新排行榜时，进行 1000 次 bootstrap 采样，计算 95% 置信区间
- **分层 ELO**: 每个 task 有独立 ELO，再聚合为全局 ELO

---

#### 赛道 B：Task-Metric ELO（指标制 — 补充赛道）

**原理**: 不做两两对战，而是将**在特定任务上的综合表现**直接映射为 ELO 分数。

**计算方法**:

```python
def compute_task_elo_score(model, task_name, nodes, goal="minimize"):
    """基于任务指标的综合得分"""
    model_nodes = [n for n in nodes 
                   if n['model'] == model and n['task_name'] == task_name]
    
    if not model_nodes:
        return None
    
    metrics = [n['metric_value'] for n in model_nodes]
    successes = [n for n in model_nodes if n.get('success')]
    
    # 1. 最佳成绩 (40%)
    best = min(metrics) if goal == "minimize" else max(metrics)
    
    # 2. 成功率 (25%)
    success_rate = len(successes) / len(model_nodes)
    
    # 3. 平均表现 (20%) - 剔除 top/bottom 5% 异常值
    trimmed = sorted(metrics)[len(metrics)//20 : -len(metrics)//20 or None]
    avg_perf = sum(trimmed) / len(trimmed) if trimmed else sum(metrics) / len(metrics)
    
    # 4. 一致性 (15%) - 标准差越小越好
    import statistics
    consistency = 1 / (1 + statistics.stdev(metrics)) if len(metrics) > 1 else 0.5
    
    return {
        'best': best,
        'success_rate': success_rate,
        'avg_performance': avg_perf,
        'consistency': consistency,
        'n_records': len(model_nodes)
    }
```

**当前数据下的预期结果**（基于已有数据分析）:

| 指标 | claude_4_5_opus | claude_4_5_sonnet | gpt5 |
|------|----------------|------------------|------|
| **nanogpt best val_loss** | 3.1407 ✅ | 3.2081 | 3.1697 |
| **nanogpt success rate** | 57.9% | 60.7% | 40.1% |
| **nanogpt avg val_loss** | 3.4109 | 3.5449 | 3.7960 |
| **grpo best accuracy** | 0.616 | **0.694** ✅ | 0.600 |
| **grpo success rate** | 42.2% | 35.0% | 17.0% |
| **grpo avg accuracy** | 0.4355 | 0.3896 | 0.3610 |

---

#### 赛道 C：Retrieval ELO（调用制 — 用户驱动赛道）

**原理**: 当用户调用 `seevomap search` / `seevomap inject` 时，记录哪些节点被检索返回，并追踪这些节点后续是否被用户采纳（用于实验）。这是一个**隐式的用户投票**机制。

**信号采集**:

```
用户行为漏斗：
  
  search("optimize transformer") → 返回 top-10 节点
       │
       ├── 曝光 (impression): 节点被展示 → +0 分
       │
       ├── 点击 (click): 用户查看详情 → +1 分
       │
       ├── 注入 (inject): 节点被注入 agent prompt → +3 分  
       │
       ├── 采纳 (adopt): 用户后续 submit 的结果引用了该节点的方法 → +10 分
       │
       └── 改进 (improve): 用户提交的结果在同任务上超过被引节点 → +5 分(被引), +15 分(提交者)
```

**实现方式**:

1. **服务端日志**: 在 HuggingFace Space 的 Gradio API 中，记录每次 `ui_search` / `inject` 调用的 query 和返回结果
2. **CLI 埋点**: 在 `seevomap-cli` 的 `search` / `inject` 命令中，添加可选的匿名使用统计上报
3. **引用追踪**: 当用户 `submit` 新节点时，检查其 `idea` 与现有节点的文本相似度，自动建立"引用"关系

```python
# 在 client.py 的 search/inject 方法中添加
def _log_retrieval(self, query: str, results: list, endpoint: str):
    """匿名记录检索事件（opt-in）"""
    if not self._telemetry_enabled:
        return
    payload = {
        "event": "retrieval",
        "query_hash": hashlib.sha256(query.encode()).hexdigest()[:16],
        "result_ids": [r.get("id") for r in results[:10]],
        "result_models": [r.get("model") for r in results[:10]],
        "timestamp": datetime.utcnow().isoformat()
    }
    # 异步上报，不阻塞主流程
    threading.Thread(target=self._send_telemetry, args=(payload,)).start()
```

**ELO 更新**: 每次检索事件构造一次"对战"——被选中的节点模型 vs 未被选中的节点模型：

```
检索返回 [node_A(opus), node_B(sonnet), node_C(gpt5)]
用户点击了 node_A → opus beats sonnet (by position), opus beats gpt5 (by position)
用户 inject 了 node_B → sonnet gets +3 bonus
```

---

### 2.3 综合 ELO 融合

三条赛道的 ELO 按加权融合为最终排名：

```
Composite_ELO = α × Arena_ELO + β × Task_ELO + γ × Retrieval_ELO

权重建议：
  α = 0.50  (对战制，最客观)
  β = 0.30  (指标制，数据可靠)
  γ = 0.20  (调用制，反映实际价值)

初始阶段（Retrieval 数据不足时）：
  α = 0.60
  β = 0.40
  γ = 0.00
```

---

## 三、数据管线设计

### 3.1 数据流全景

```
                         ┌─────────────────────┐
                         │   数据源层           │
                         ├─────────────────────┤
                         │ • map.json (4279节点)│
                         │ • HF Dataset         │
                         │ • Gradio API logs    │
                         │ • CLI telemetry      │
                         │ • ResearchClawBench  │
                         └────────┬────────────┘
                                  │
                         ┌────────▼────────────┐
                         │   ETL 管线          │
                         ├─────────────────────┤
                         │ 1. 解析 model 字段   │
                         │ 2. 按 task 分组      │
                         │ 3. 构造对战对        │
                         │ 4. 计算 ELO          │
                         │ 5. Bootstrap CI      │
                         └────────┬────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
              │ elo.json  │ │ API     │ │ 前端页面  │
              │ (HF存储)  │ │ endpoint│ │ Leaderboard│
              └───────────┘ └─────────┘ └───────────┘
```

### 3.2 ELO 计算引擎（核心模块）

```python
# seevomap/elo.py — 核心 ELO 计算引擎

import json
import random
import math
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class ELORating:
    model: str
    rating: float = 1500.0
    n_matches: int = 0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    confidence_interval: tuple = (1500.0, 1500.0)

# 任务配置：定义每个任务的优化方向和平局阈值
TASK_CONFIG = {
    "nanogpt-speedrun": {
        "metric": "val_loss",
        "goal": "minimize",
        "draw_threshold_pct": 0.005,  # 0.5% 以内算平局
    },
    "grpo-math": {
        "metric": "accuracy",
        "goal": "maximize",
        "draw_threshold_pct": 0.01,   # 1% 以内算平局
    },
    "ScivBook/IdeaMiner": {
        "metric": "novelty_score",
        "goal": "maximize",
        "draw_threshold_pct": 0.02,
    },
    "parameter-golf": {
        "metric": "val_bpb",
        "goal": "minimize",
        "draw_threshold_pct": 0.005,
    },
    # ResearchClawBench tasks
    "_default_rcb": {
        "metric": "checklist_score",
        "goal": "maximize",
        "draw_threshold_pct": 0.05,
    }
}

class ELOEngine:
    def __init__(self, k_new=32, k_mature=16, mature_threshold=50):
        self.ratings = defaultdict(lambda: ELORating(model=""))
        self.k_new = k_new
        self.k_mature = k_mature
        self.mature_threshold = mature_threshold
        self.match_history = []

    def _get_k(self, model: str) -> float:
        r = self.ratings[model]
        return self.k_new if r.n_matches < self.mature_threshold else self.k_mature

    def _expected_score(self, ra: float, rb: float) -> float:
        return 1 / (1 + 10 ** ((rb - ra) / 400))

    def record_match(self, model_a: str, model_b: str, 
                     metric_a: float, metric_b: float,
                     goal: str = "minimize", draw_threshold_pct: float = 0.005):
        """记录一场对战并更新 ELO"""
        # 初始化
        if not self.ratings[model_a].model:
            self.ratings[model_a] = ELORating(model=model_a)
        if not self.ratings[model_b].model:
            self.ratings[model_b] = ELORating(model=model_b)

        ra = self.ratings[model_a].rating
        rb = self.ratings[model_b].rating

        # 判定胜负
        if goal == "minimize":
            diff_pct = abs(metric_a - metric_b) / max(abs(metric_a), abs(metric_b), 1e-10)
            if diff_pct < draw_threshold_pct:
                sa, sb = 0.5, 0.5  # 平局
            elif metric_a < metric_b:
                sa, sb = 1.0, 0.0  # A 胜
            else:
                sa, sb = 0.0, 1.0  # B 胜
        else:  # maximize
            diff_pct = abs(metric_a - metric_b) / max(abs(metric_a), abs(metric_b), 1e-10)
            if diff_pct < draw_threshold_pct:
                sa, sb = 0.5, 0.5
            elif metric_a > metric_b:
                sa, sb = 1.0, 0.0
            else:
                sa, sb = 0.0, 1.0

        # 计算预期胜率
        ea = self._expected_score(ra, rb)
        eb = self._expected_score(rb, ra)

        # 更新 ELO
        ka = self._get_k(model_a)
        kb = self._get_k(model_b)
        self.ratings[model_a].rating += ka * (sa - ea)
        self.ratings[model_b].rating += kb * (sb - eb)

        # 更新统计
        for model, s in [(model_a, sa), (model_b, sb)]:
            self.ratings[model].n_matches += 1
            if s == 1.0:
                self.ratings[model].wins += 1
            elif s == 0.0:
                self.ratings[model].losses += 1
            else:
                self.ratings[model].draws += 1

    def compute_from_graph(self, nodes: list, n_samples: int = 50000):
        """从 SeevoMap 图谱数据直接计算 ELO"""
        # 按任务分组
        task_groups = defaultdict(lambda: defaultdict(list))
        for node in nodes:
            task = node.get("task_name", "")
            model = node.get("model", "")
            if task and model and node.get("metric_value") is not None:
                task_groups[task][model].append(node)

        # 对每个任务进行采样对战
        for task, model_nodes in task_groups.items():
            models = [m for m, ns in model_nodes.items() if len(ns) >= 5]
            if len(models) < 2:
                continue

            config = TASK_CONFIG.get(task, TASK_CONFIG.get("_default_rcb", {}))
            goal = config.get("goal", "minimize")
            threshold = config.get("draw_threshold_pct", 0.01)

            for _ in range(n_samples // len(task_groups)):
                m1, m2 = random.sample(models, 2)
                n1 = random.choice(model_nodes[m1])
                n2 = random.choice(model_nodes[m2])
                self.record_match(
                    m1, m2,
                    n1["metric_value"], n2["metric_value"],
                    goal=goal, draw_threshold_pct=threshold
                )

    def bootstrap_ci(self, nodes: list, n_bootstrap: int = 1000, n_samples: int = 50000):
        """Bootstrap 计算置信区间"""
        all_ratings = defaultdict(list)
        
        for _ in range(n_bootstrap):
            engine = ELOEngine()
            # 有放回采样
            sampled_nodes = random.choices(nodes, k=len(nodes))
            engine.compute_from_graph(sampled_nodes, n_samples=n_samples)
            for model, rating in engine.ratings.items():
                all_ratings[model].append(rating.rating)

        for model in self.ratings:
            if model in all_ratings:
                ratings = sorted(all_ratings[model])
                lo = ratings[int(0.025 * len(ratings))]
                hi = ratings[int(0.975 * len(ratings))]
                self.ratings[model].confidence_interval = (round(lo, 1), round(hi, 1))

    def leaderboard(self) -> list[dict]:
        """生成排行榜"""
        board = []
        for model, r in sorted(self.ratings.items(), key=lambda x: -x[1].rating):
            if r.n_matches < 10:
                continue
            board.append({
                "rank": 0,
                "model": model,
                "elo": round(r.rating, 1),
                "ci_95": list(r.confidence_interval),
                "matches": r.n_matches,
                "wins": r.wins,
                "losses": r.losses,
                "draws": r.draws,
                "win_rate": round(r.wins / r.n_matches * 100, 1) if r.n_matches > 0 else 0,
            })
        for i, entry in enumerate(board):
            entry["rank"] = i + 1
        return board
```

### 3.3 输出格式（`elo.json`）

```json
{
  "version": "1.0.0",
  "updated_at": "2025-07-15T00:00:00Z",
  "total_matches": 150000,
  "total_nodes": 4279,
  "methodology": "arena_elo_v1",
  "leaderboard": [
    {
      "rank": 1,
      "model": "claude_4_5_opus",
      "elo": 1587.3,
      "ci_95": [1572.1, 1603.8],
      "matches": 48231,
      "wins": 27892,
      "losses": 16543,
      "draws": 3796,
      "win_rate": 57.8,
      "per_task": {
        "nanogpt-speedrun": {"elo": 1612.5, "best": 3.1407, "n": 677},
        "grpo-math": {"elo": 1558.2, "best": 0.616, "n": 462}
      }
    },
    {
      "rank": 2,
      "model": "claude_4_5_sonnet",
      "elo": 1534.6,
      "ci_95": [1518.2, 1549.1],
      "matches": 43120,
      "wins": 23456,
      "losses": 16234,
      "draws": 3430,
      "win_rate": 54.4,
      "per_task": {
        "nanogpt-speedrun": {"elo": 1521.8, "best": 3.2081, "n": 638},
        "grpo-math": {"elo": 1548.7, "best": 0.694, "n": 354}
      }
    }
  ],
  "task_configs": {
    "nanogpt-speedrun": {"goal": "minimize", "metric": "val_loss"},
    "grpo-math": {"goal": "maximize", "metric": "accuracy"},
    "ScivBook/IdeaMiner": {"goal": "maximize", "metric": "novelty_score"}
  }
}
```

---

## 四、前端排行榜页面设计

### 4.1 页面路由

在 SeevoMap-Home 中新增页面：`/leaderboard`

```
src/pages/LeaderboardPage.tsx   — 排行榜主页
src/components/ELOTable.tsx     — ELO 排名表格
src/components/ELOChart.tsx     — ELO 走势图/雷达图
src/components/MatchupMatrix.tsx — 对战胜率矩阵
```

### 4.2 UI 布局

```
┌───────────────────────────────────────────────────────┐
│  SeevoMap ELO Leaderboard                             │
│  "Which model produces the best research genes?"      │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🏆 Overall Ranking                              │  │
│  │                                                 │  │
│  │  #1  claude_4_5_opus    1587 ▓▓▓▓▓▓▓▓▓░ ±16   │  │
│  │  #2  claude_4_5_sonnet  1535 ▓▓▓▓▓▓▓▓░░ ±15   │  │
│  │  #3  gpt5               1482 ▓▓▓▓▓▓▓░░░ ±18   │  │
│  │  #4  deepseek-v3        1396 ▓▓▓▓▓▓░░░░ ±22   │  │
│  │                                                 │  │
│  │  Based on 150,000 matches across 3 tasks        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────┐  ┌───────────────────────────┐  │
│  │ Task Selector    │  │ Head-to-Head Matrix       │  │
│  │ ○ All Tasks      │  │                           │  │
│  │ ○ nanogpt        │  │      opus  sonnet  gpt5   │  │
│  │ ○ grpo-math      │  │ opus  —    58.2%  63.7%  │  │
│  │ ○ ScivBook       │  │ sonnet 41.8% —   56.1%   │  │
│  │ ○ RClawBench     │  │ gpt5  36.3% 43.9%  —     │  │
│  └─────────────────┘  └───────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📊 Radar Chart: Model Capabilities              │  │
│  │                                                 │  │
│  │        Best Score                               │  │
│  │           ╱╲                                    │  │
│  │  Consistency ╱    ╲ Success Rate                │  │
│  │           ╲    ╱                                │  │
│  │        Avg Perf                                 │  │
│  │                                                 │  │
│  │  — opus  — sonnet  — gpt5                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📈 ELO Trend Over Time                          │  │
│  │  (as new nodes are submitted, ELO recalculated) │  │
│  │                                                 │  │
│  │  1600 ┤                      ╭─── opus          │  │
│  │  1550 ┤               ╭─────╯                   │  │
│  │  1500 ┤─────╮────────╯────────── sonnet         │  │
│  │  1450 ┤     ╰──────────────────── gpt5          │  │
│  │       └──────────────────────────────           │  │
│  │        Jan   Feb   Mar   Apr   May              │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

### 4.3 交互功能

1. **任务筛选器**: 可按 task 查看分任务 ELO
2. **对战详情**: 点击模型对可查看具体对战样例（展示两个节点的 idea 和 metric_value）
3. **节点追溯**: 点击某模型可跳转到 Graph 页面，筛选该模型的所有节点
4. **CI 可视化**: 鼠标悬停显示 95% 置信区间
5. **实时更新**: 每次有新节点 submit 且 approved 后，触发 ELO 重新计算

---

## 五、SeevoMap CLI 集成

### 5.1 新增 CLI 命令

```bash
# 查看排行榜
seevomap leaderboard
seevomap leaderboard --task nanogpt-speedrun
seevomap leaderboard --format json

# 查看对战详情
seevomap leaderboard matchup claude_4_5_opus gpt5

# 查看特定模型的战绩
seevomap leaderboard model claude_4_5_opus
```

### 5.2 CLI 输出示例

```
$ seevomap leaderboard

SeevoMap ELO Leaderboard (updated: 2025-07-15)
Based on 150,000 matches across 4,279 execution records

 Rank  Model               ELO    95% CI          Win%   Matches
 ─────────────────────────────────────────────────────────────────
  #1   claude_4_5_opus     1587   [1572, 1604]    57.8%  48,231
  #2   claude_4_5_sonnet   1535   [1518, 1549]    54.4%  43,120
  #3   gpt5                1482   [1461, 1498]    46.2%  38,649
  #4   deepseek-v3         1396   [1370, 1422]    41.5%  20,000

 Tasks: nanogpt-speedrun · grpo-math · ScivBook/IdeaMiner
 Methodology: Arena ELO with Bootstrap CI (n=1000)
```

### 5.3 SDK 接口

```python
from seevomap import SeevoMap

svm = SeevoMap()

# 获取排行榜
board = svm.leaderboard()
for entry in board:
    print(f"#{entry['rank']} {entry['model']}: ELO {entry['elo']}")

# 获取特定模型的 ELO
rating = svm.model_rating("claude_4_5_opus")
print(f"ELO: {rating['elo']}, Win rate: {rating['win_rate']}%")
```

---

## 六、与 ResearchClawBench 的联动

### 6.1 ResearchClawBench 作为标准评测赛道

ResearchClawBench 定义了一组标准化科研任务（Physics_000, Chemistry_000, Math_000 等），每个任务有明确的 `checklist_score` 评分。这天然适合作为 ELO 的一个独立评测赛道：

```
SeevoMap ELO 赛道体系：
├── 赛道 1: Auto-Research (nanogpt-speedrun, grpo-math)  ← 现有数据
├── 赛道 2: ScivBook Hypothesis (IdeaMiner)               ← 现有数据
├── 赛道 3: ResearchClawBench (标准化科研复现)            ← 标准赛道
└── 赛道 4: Community Tasks (用户提交任务)                ← 增长赛道
```

### 6.2 联动方式

1. **评测数据接入**: 当 ResearchClawBench 跑出新评测结果时，自动 submit 到 SeevoMap 图谱，并标注 `source: "ResearchClawBench/{task_id}"`
2. **统一 model 字段**: 确保 ResearchClawBench 记录的 `model` 字段与 SeevoMap 一致
3. **ELO 权重加成**: ResearchClawBench 任务因其标准化程度高，在综合 ELO 中可以给予更高权重

```python
TASK_WEIGHT = {
    "nanogpt-speedrun": 1.0,
    "grpo-math": 1.0,
    "ScivBook/IdeaMiner": 0.8,      # 假说生成，主观性较高
    "ResearchClawBench/*": 1.5,     # 标准化评测，权重更高
    "parameter-golf": 1.2,
    "community/*": 0.6,             # 社区任务，质量参差
}
```

---

## 七、公平性与反作弊

### 7.1 已知偏差及应对

| 偏差类型 | 描述 | 应对措施 |
|---------|------|---------|
| **任务覆盖偏差** | deepseek-v3 只在 ScivBook 上有数据，不参与 nanogpt/grpo 对战 | 标注"任务覆盖度"，不在缺失赛道上给默认分 |
| **数据量偏差** | opus 有 1139 条 vs gpt5 有 902 条 | Bootstrap 采样 + 按比例采样对战 |
| **时间偏差** | 模型可能随 API 版本迭代而变强 | 记录 timestamp，支持按时间段筛选 |
| **自评偏差** | 某些 ScivBook 的 novelty_score 是自评分数 | 对自评指标降权，或要求外部评审 |
| **刷分攻击** | 恶意提交大量高分记录 | 审核机制（pending → approved）+ 异常检测 |

### 7.2 异常检测

```python
def detect_anomalies(nodes: list) -> list:
    """检测可能的异常提交"""
    anomalies = []
    
    for task, task_nodes in group_by_task(nodes).items():
        metrics = [n['metric_value'] for n in task_nodes]
        mean, std = statistics.mean(metrics), statistics.stdev(metrics)
        
        for n in task_nodes:
            z_score = abs(n['metric_value'] - mean) / std if std > 0 else 0
            if z_score > 3.0:  # 超过 3 个标准差
                anomalies.append({
                    "node_id": n['id'],
                    "model": n['model'],
                    "z_score": z_score,
                    "reason": "metric_outlier"
                })
    
    return anomalies
```

### 7.3 最低参赛门槛

- **模型至少有 10 条记录**才进入排行榜
- **模型至少覆盖 1 个标准任务**（nanogpt/grpo/RClawBench）
- **记录必须为 `status: approved`** 才计入 ELO

---

## 八、实施路线图

### Phase 1: 静态 ELO（2 周）

**目标**: 基于现有 `map.json` 计算离线 ELO 排名

- [ ] 实现 `seevomap/elo.py` 核心计算引擎
- [ ] 编写 `scripts/compute_elo.py` 批处理脚本
- [ ] 生成 `elo.json` 并推送到 HF Dataset
- [ ] 在 SeevoMap-Home 新增 `/leaderboard` 页面（静态展示）
- [ ] CLI 新增 `seevomap leaderboard` 命令

**交付物**:
```
seevomap-cli/seevomap/elo.py          # ELO 计算引擎
seevomap-cli/scripts/compute_elo.py   # 批处理脚本
SeevoMap-Home/src/pages/LeaderboardPage.tsx  # 前端页面
SeevoMap-Home/public/elo.json         # 静态 ELO 数据
```

### Phase 2: 动态更新（2 周）

**目标**: 每次新节点 approved 时自动更新 ELO

- [ ] 在 HF Space Gradio 后端新增 ELO 更新逻辑
- [ ] 新增 API endpoint: `GET /elo/leaderboard`, `GET /elo/model/{name}`
- [ ] 实现增量 ELO 更新（不需要每次重算全部）
- [ ] 前端接入实时 API

### Phase 3: Retrieval ELO（3 周）

**目标**: 接入用户调用数据的 ELO 赛道

- [ ] CLI 添加匿名 telemetry（opt-in）
- [ ] HF Space 记录 search/inject 调用日志
- [ ] 实现 Retrieval ELO 计算
- [ ] 三赛道融合 Composite ELO

### Phase 4: ResearchClawBench 联动（2 周）

**目标**: 将 ResearchClawBench 作为标准评测赛道

- [ ] 定义 RClawBench → SeevoMap 的数据映射
- [ ] 自动化提交管线
- [ ] 在 Leaderboard 页面新增 "Standard Benchmark" 子tab

### Phase 5: 社区运营（持续）

**目标**: 让社区主动贡献评测数据

- [ ] 新增 `seevomap benchmark submit` 命令
- [ ] 设计"挑战赛"机制——指定任务，鼓励不同模型/研究者提交
- [ ] 月度 ELO 报告自动生成
- [ ] 与 ResearchClawBench GitHub 联动发布

---

## 九、技术栈与资源需求

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| ELO 计算引擎 | Python (无额外依赖) | 纯 Python 实现，集成到 seevomap-cli |
| 前端排行榜 | React + TypeScript | 复用 SeevoMap-Home 现有技术栈 |
| 数据存储 | HF Dataset + `elo.json` | 与现有 `map.json` 共存 |
| API | Gradio (HF Space) | 复用现有后端 |
| 定时任务 | GitHub Actions | 每天/每周自动重新计算 ELO |
| 可视化 | Recharts / D3.js | ELO 走势图、雷达图、矩阵热力图 |

---

## 十、预期影响

1. **用户价值**: 用户在 `seevomap inject` 时可以优先信任高 ELO 模型的科研基因
2. **模型评测价值**: 首个基于"真实科研执行结果"的模型排行榜，与 Chatbot Arena 互补
3. **社区价值**: 激励更多模型/研究者提交高质量执行记录
4. **学术价值**: "Research Gene ELO" 可以作为独立论文发表，提出一种新的模型评测范式
5. **产品价值**: 排行榜页面增加 SeevoMap 网站流量和用户粘性

---

## 附录 A：现有数据基础分析

基于当前 `map.json` 的数据分析：

### A.1 模型在 nanogpt-speedrun 上的表现

| 模型 | 记录数 | 成功数 | 最佳 val_loss | 平均 val_loss | 成功率 |
|------|-------|-------|-------------|-------------|-------|
| claude_4_5_opus | 677 | 392 | **3.1407** | 3.4109 | 57.9% |
| claude_4_5_sonnet | 638 | 387 | 3.2081 | 3.5449 | 60.7% |
| gpt5 | 449 | 180 | 3.1697 | 3.7960 | 40.1% |

### A.2 模型在 grpo-math 上的表现

| 模型 | 记录数 | 成功数 | 最佳 accuracy | 平均 accuracy | 成功率 |
|------|-------|-------|-------------|-------------|-------|
| claude_4_5_opus | 462 | 195 | 0.616 | 0.4355 | 42.2% |
| claude_4_5_sonnet | 354 | 124 | **0.694** | 0.3896 | 35.0% |
| gpt5 | 453 | 77 | 0.600 | 0.3610 | 17.0% |

### A.3 图谱连接度

| 模型 | 平均节点度 | 平均加权度 |
|------|----------|----------|
| claude_4_5_opus | 9.9 | 9.09 |
| claude_4_5_sonnet | 10.4 | 9.58 |
| gpt5 | 9.8 | 8.79 |
| deepseek-v3 | 10.0 | 8.28 |

---

## 附录 B：名词对照表

| 术语 | 说明 |
|------|------|
| 科研基因 (Research Gene) | SeevoMap 中的一条执行记录节点 |
| Arena ELO | 基于随机对战的 ELO 排名 |
| Task ELO | 基于任务指标的 ELO 排名 |
| Retrieval ELO | 基于用户调用行为的 ELO 排名 |
| Composite ELO | 三赛道加权融合的最终 ELO |
| Bootstrap CI | 通过 Bootstrap 重采样计算的 95% 置信区间 |
| ResearchClawBench | 标准化科研复现 benchmark |
