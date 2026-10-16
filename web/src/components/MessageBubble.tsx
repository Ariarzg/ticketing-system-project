import { Avatar } from "@heroui/react";
import type { Role } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/dates";
import { initials } from "@/lib/initials";
import { t } from "@/lib/strings.fa";

/**
 * One message. The first bubble of every thread is the ticket description (D17).
 * dir="auto" lets each message align by its own language, so English inside a Persian page reads correctly.
 * `grouped` is a follow-up from the same author a few minutes later: no avatar or name line, and closer to the one before.
 */
export function MessageBubble({
  author,
  role,
  body,
  createdAt,
  mine,
  grouped = false,
}: {
  author: string;
  role?: Role;
  body: string;
  createdAt: string;
  mine: boolean;
  grouped?: boolean;
}) {
  return (
    <div className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""} ${grouped ? "-mt-3.5" : ""}`}>
      {grouped ? (
        // Keeps the bubble lined up with the one above, where the avatar is.
        <span className="w-8 shrink-0" />
      ) : (
        <Avatar size="sm" color={role === "agent" ? "accent" : "default"} variant="soft" className="shrink-0">
          <Avatar.Fallback>{initials(author)}</Avatar.Fallback>
        </Avatar>
      )}
      <div className={`flex max-w-[82%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
        {!grouped && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted">
            <span className="font-medium text-foreground">{author}</span>
            {role === "agent" && (
              <span className="rounded-full bg-accent-soft px-1.5 leading-5 text-accent-soft-foreground">
                {t.role.agent}
              </span>
            )}
            <time dateTime={createdAt} title={formatDate(createdAt)}>
              {formatRelative(createdAt)}
            </time>
          </div>
        )}
        <p
          dir="auto"
          title={grouped ? formatDate(createdAt) : undefined}
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-base leading-relaxed ${
            mine ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-foreground"
          }`}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
