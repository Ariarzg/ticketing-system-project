"use client";

import { useState } from "react";
import { ArrowsClockwiseIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingButton } from "@/components/LoadingButton";
import type { MeUser } from "@/lib/hooks/use-me";
import { useMessages } from "@/lib/hooks/use-messages";
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

/** Staff only. Closing asks for confirmation because it cannot be undone (D2). */
export function StatusControl({ ticket, me }: { ticket: TicketDto; me: MeUser }) {
  const setStatus = useSetStatus(ticket.id);
  // The thread already polls these messages, so this reads the same cached list.
  const { data: messages } = useMessages(ticket.id);
  const [confirming, setConfirming] = useState(false);
  if (ticket.status === "closed") return null;

  // While a reply waits for review the API refuses "answered" and "closed" (D27), so the buttons say so up front.
  const pendingReview = !!messages?.some((m) => m.review?.status === "pending");
  const blocked = (to: Target) => pendingReview && to !== "in_progress";

  function choose(to: Target) {
    if (to === "closed") setConfirming(true);
    else setStatus.mutate(to);
  }

  // On a phone the panel is full width, so the two status buttons share a row and "close" gets its own;
  // in the narrow desktop panel every button takes a full row.
  return (
    <div className="flex flex-col gap-2 border-t border-separator pt-4">
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
              isDisabled={blocked(to) || (setStatus.isPending && setStatus.variables !== to)}
              icon={<Icon size={16} />}
              onPress={() => choose(to)}
            >
              {label}
            </LoadingButton>
          ))}
      </div>
      {pendingReview && (
        <p className="text-xs leading-relaxed text-muted">
          {me.role === "supervisor" ? t.thread.pendingBlocksSupervisor : t.thread.pendingBlocksAgent}
        </p>
      )}
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
