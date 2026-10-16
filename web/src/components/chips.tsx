import { Chip } from "@heroui/react";
import { CellSignalHighIcon, CellSignalLowIcon, CellSignalMediumIcon } from "@phosphor-icons/react/dist/ssr";
import type { Department, Priority, Status } from "@/lib/constants";
import { t } from "@/lib/strings.fa";

// Colour belongs to status. Priority is told apart by its signal icon, and only "high" is red,
// so a priority chip never looks like a status chip next to it.
const statusColor = {
  open: "accent",
  in_progress: "warning",
  answered: "success",
  closed: "default",
} as const;

const priorityColor = {
  low: "default",
  medium: "default",
  high: "danger",
} as const;

const priorityIcon = {
  low: CellSignalLowIcon,
  medium: CellSignalMediumIcon,
  high: CellSignalHighIcon,
} as const;

/** `withLabel` adds "وضعیت:" for screen readers, for places where no visible label says what the chip is. */
export function StatusChip({ status, withLabel = false }: { status: Status; withLabel?: boolean }) {
  return (
    // "Open" is solid: with the mint accent a soft one looks like the green "answered" chip.
    <Chip size="sm" color={statusColor[status]} variant={status === "open" ? "primary" : "soft"}>
      {withLabel && <span className="sr-only">{t.tickets.colStatus}: </span>}
      {t.status[status]}
    </Chip>
  );
}

export function PriorityChip({ priority, withLabel = false }: { priority: Priority; withLabel?: boolean }) {
  const Icon = priorityIcon[priority];
  return (
    <Chip size="sm" color={priorityColor[priority]} variant="soft">
      <Icon size={12} weight="bold" aria-hidden />
      {withLabel && <span className="sr-only">{t.tickets.colPriority}: </span>}
      {t.priority[priority]}
    </Chip>
  );
}

export function DepartmentChip({ department }: { department: Department }) {
  return (
    <Chip size="sm" color="default" variant="soft">
      {t.department[department]}
    </Chip>
  );
}
