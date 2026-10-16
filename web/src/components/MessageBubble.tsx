import { Avatar } from "@heroui/react";
import type { Role } from "@/lib/constants";
import { formatRelative } from "@/lib/dates";
import { initials } from "@/lib/initials";
import { t } from "@/lib/strings.fa";

/**
 * One message. The first bubble of every thread is the ticket description (D17).
 * dir="auto" lets each message align by its own language, so English inside a Persian page reads correctly.
 */
export function MessageBubble({
  author,
  role,
  body,
  createdAt,
  mine,
}: {
  author: string;
  role?: Role;
  body: string;
  createdAt: string;
  mine: boolean;
}) {
  return (
    <div className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
      <Avatar size="sm" color={role === "agent" ? "accent" : "default"} variant="soft" className="shrink-0">
        <Avatar.Fallback>{initials(author)}</Avatar.Fallback>
      </Avatar>
      <div className={`flex max-w-[82%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-2 px-1 text-xs text-muted">
          <span className="font-medium text-foreground">{author}</span>
          {role === "agent" && <span>{t.role.agent}</span>}
          <time dateTime={createdAt}>{formatRelative(createdAt)}</time>
        </div>
        <p
          dir="auto"
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
            mine ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-foreground"
          }`}
        >
          {body}
        </p>
      </div>
    </div>
  );
}