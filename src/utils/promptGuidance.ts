export interface GuidanceItem {
  label: string;
  detail: string;
}

export const USER_REQUEST_FIELDS: GuidanceItem[] = [
  {
    label: "Task",
    detail:
      "Replace `OpenAI Parameter Golf` with your own benchmark, research problem, or product task.",
  },
  {
    label: "Dataset / setup",
    detail:
      "Replace `FineWeb` with the dataset, benchmark split, or evaluation setting your repo actually uses, and mention which local assets should already be prepared, such as downloaded shards, tokenizers, checkpoints, or caches.",
  },
  {
    label: "Constraint",
    detail:
      "Replace `under 16MB` with your real hard limit on size, latency, compute, budget, or wall-clock time.",
  },
  {
    label: "Metric",
    detail:
      "Replace `val_bpb` with the number that decides whether the experiment was better or worse.",
  },
  {
    label: "Code area / eval path",
    detail:
      "Replace `parameter-golf/` with the folder or subdirectory where changes should stay, and name the exact eval path if your repo has more than one way to run the experiment.",
  },
];

export const AUTORESEARCH_HANDLES: GuidanceItem[] = [
  {
    label: "Community lookup",
    detail:
      "Check SeevoMap for several similar experiments before proposing a code or config change.",
  },
  {
    label: "Synthesis",
    detail:
      "Compare multiple related runs, then synthesize the strongest shared signals, disagreements, and failure patterns before suggesting a next step.",
  },
  {
    label: "Scope control",
    detail:
      "Keep each iteration to one small change instead of a pile of edits that are hard to evaluate.",
  },
  {
    label: "Evaluation",
    detail:
      "Use the repo's normal eval path when the environment allows it, or point the user at the exact command to run.",
  },
  {
    label: "Decision",
    detail:
      "Report the updated metric and whether the change is worth keeping for the next loop.",
  },
];
