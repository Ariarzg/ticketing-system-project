import { EmptyState } from "@heroui/react";

/** A friendly empty state: an icon, a short sentence, and optionally the next action. */
export function EmptyBox({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <EmptyState className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-secondary text-muted">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        {hint && <p className="mt-1 max-w-[40ch] text-sm leading-relaxed text-muted">{hint}</p>}
      </div>
      {action}
    </EmptyState>
  );
}