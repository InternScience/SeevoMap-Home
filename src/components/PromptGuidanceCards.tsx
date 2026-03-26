import type { GuidanceItem } from "../utils/promptGuidance";

interface PromptGuidanceCardsProps {
  userItems: GuidanceItem[];
  handledItems: GuidanceItem[];
  handledTitle?: string;
  eyebrow?: string;
  intro?: string;
}

function GuidanceColumn({
  title,
  items,
}: {
  title: string;
  items: GuidanceItem[];
}) {
  return (
    <div className="guidance-column rounded-[1.35rem] p-5">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
          {title}
        </p>
        <div className="guidance-divider h-px flex-1" />
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${item.detail}`}
            className={index > 0 ? "border-t border-white/6 pt-4" : undefined}
          >
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              {item.label}
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PromptGuidanceCards({
  userItems,
  handledItems,
  handledTitle = "What The Skill Handles",
  eyebrow = "How To Adapt This Example",
  intro,
}: PromptGuidanceCardsProps) {
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-[0.14em] text-text-muted mb-2">
        {eyebrow}
      </p>
      {intro ? (
        <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
          {intro}
        </p>
      ) : null}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GuidanceColumn title="What You Tell The Agent" items={userItems} />
        <GuidanceColumn title={handledTitle} items={handledItems} />
      </div>
    </div>
  );
}
