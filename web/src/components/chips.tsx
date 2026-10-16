import { Chip } from "@heroui/react";
import type { Department, Priority, Status } from "@/lib/constants";
import { t } from "@/lib/strings.fa";

const statusColor = {
  open: "accent",
  in_progress: "warning",
  answered: "success",
  closed: "default",
} as const;

const priorityColor = {
  low: "default",
  medium: "warning",
  high: "danger",
} as const;

export function StatusChip({ status }: { status: Status }) {
  return (
    <Chip size="sm" color={statusColor[status]} variant="soft">
      {t.status[status]}
    </Chip>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <Chip size="sm" color={priorityColor[priority]} variant="soft">
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