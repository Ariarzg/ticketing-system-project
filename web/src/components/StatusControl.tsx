"use client";

import { Button } from "@heroui/react";
import { ArrowsClockwiseIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { useSetStatus } from "@/lib/hooks/use-set-status";
import type { TicketDto } from "@/lib/hooks/use-tickets";
import { t } from "@/lib/strings.fa";

type Target = "in_progress" | "answered" | "closed";

const targets = [
  { to: "in_progress", label: t.thread.setInProgress, icon: ArrowsClockwiseIcon },
  { to: "answered", label: t.thread.setAnswered, icon: CheckCircleIcon },
  { to: "closed", label: t.thread.close, icon: LockSimpleIcon },
] as const;

/** Agent only. Closing asks for confirmation because it cannot be undone (D2). */
export function StatusControl({ ticket }: { ticket: TicketDto }) {
  const setStatus = useSetStatus(ticket.id);
  if (ticket.status === "closed") return null;

  function choose(to: Target) {
    if (to === "closed" && !window.confirm(t.thread.confirmClose)) return;
    setStatus.mutate(to);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted">{t.thread.changeStatus}</p>
      {targets
        .filter((x) => x.to !== ticket.status)
        .map(({ to, label, icon: Icon }) => (
          <Button
            key={to}
            size="sm"
            fullWidth
            variant={to === "closed" ? "danger-soft" : "secondary"}
            isDisabled={setStatus.isPending}
            onPress={() => choose(to)}
          >
            <Icon size={16} />
            {label}
          </Button>
        ))}
    </div>
  );
}