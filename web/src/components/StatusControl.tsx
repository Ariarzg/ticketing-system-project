"use client";

import { useState } from "react";
import { ArrowsClockwiseIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingButton } from "@/components/LoadingButton";
import { useSetStatus } from "@/lib/hooks/use-set-status";
import type { TicketDto } from "@/lib/hooks/use-tickets";
import { t } from "@/lib/strings.fa";

type Target = "in_progress" | "answered" | "closed";

// Labels are actions ("change to ..."), so they do not read like the status chip above them.
const targets = [
  { to: "in_progress", label: t.thread.setInProgress, icon: ArrowsClockwiseIcon },
  { to: "answered", label: t.thread.setAnswered, icon: CheckCircleIcon },
  { to: "closed", label: t.thread.close, icon: LockSimpleIcon },
] as const;

/** Agent only. Closing asks for confirmation because it cannot be undone (D2). */
export function StatusControl({ ticket }: { ticket: TicketDto }) {
  const setStatus = useSetStatus(ticket.id);
  const [confirming, setConfirming] = useState(false);
  if (ticket.status === "closed") return null;

  function choose(to: Target) {
    if (to === "closed") setConfirming(true);
    else setStatus.mutate(to);
  }

  // On a phone the panel is full width, so the two status buttons share a row and "close" gets its own;
  // in the narrow desktop panel every button takes a full row.
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted">{t.thread.changeStatus}</p>
      <div className="flex flex-wrap gap-2">
        {targets
          .filter((x) => x.to !== ticket.status)
          .map(({ to, label, icon: Icon }) => (
            <LoadingButton
              key={to}
              size="sm"
              variant={to === "closed" ? "danger-soft" : "secondary"}
              className={to === "closed" ? "basis-full" : "min-w-0 flex-1 basis-[calc(50%-0.25rem)] lg:basis-full"}
              isPending={setStatus.isPending && setStatus.variables === to}
              isDisabled={setStatus.isPending && setStatus.variables !== to}
              icon={<Icon size={16} />}
              onPress={() => choose(to)}
            >
              {label}
            </LoadingButton>
          ))}
      </div>
      <ConfirmDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={t.thread.confirmCloseTitle}
        text={t.thread.confirmClose}
        confirmLabel={t.thread.close}
        onConfirm={() => setStatus.mutate("closed")}
      />
    </div>
  );
}
