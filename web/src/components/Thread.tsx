"use client";

import { useEffect, useRef, useState } from "react";
import { Kbd, ScrollShadow, Skeleton, TextArea } from "@heroui/react";
import { LockSimpleIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useMessages, useSendMessage } from "@/lib/hooks/use-messages";
import type { MeUser } from "@/lib/hooks/use-me";
import type { TicketDto } from "@/lib/hooks/use-tickets";
import { t } from "@/lib/strings.fa";
import { LoadingButton } from "./LoadingButton";
import { MessageBubble } from "./MessageBubble";

/** Messages from the same author within this time are shown as one group. */
const GROUP_WINDOW_MS = 5 * 60_000;

function readDraft(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return ""; // private mode or no storage: start empty
  }
}

export function Thread({ ticket, me }: { ticket: TicketDto; me: MeUser }) {
  const { data: messages, isLoading } = useMessages(ticket.id);
  const send = useSendMessage(ticket.id);
  // The unsent reply survives a reload or a visit to another page, for this browser tab.
  const draftKey = `reply:${ticket.id}`;
  const [body, setBody] = useState(() => readDraft(draftKey));
  const listRef = useRef<HTMLDivElement>(null);
  // True while the reader is at the newest message. Polled messages only scroll the list then,
  // so someone reading older messages is not pulled down every few seconds.
  const atBottom = useRef(true);
  const count = messages?.length ?? 0;
  const closed = ticket.status === "closed";

  useEffect(() => {
    try {
      if (body) sessionStorage.setItem(draftKey, body);
      else sessionStorage.removeItem(draftKey);
    } catch {
      // No storage: the draft is just not kept.
    }
  }, [body, draftKey]);

  useEffect(() => {
    const el = listRef.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [count]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function submit() {
    const text = body.trim();
    if (!text || send.isPending) return;
    atBottom.current = true; // your own message always comes into view
    send.mutate(text, { onSuccess: () => setBody("") });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
      {/* role="log": screen readers announce messages that arrive by polling, without reading the whole thread again. */}
      <ScrollShadow
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={t.thread.label}
        className="flex max-h-[32rem] min-h-48 flex-col gap-5 overflow-y-auto overscroll-contain p-4 sm:p-5"
      >
        {/* The description is the first bubble of the thread (D17). */}
        <MessageBubble
          author={ticket.authorName}
          body={ticket.description}
          createdAt={ticket.createdAt}
          mine={ticket.authorId === me.id}
        />
        {isLoading && <MessagesSkeleton />}
        {messages?.map((m, i) => {
          const prev = i === 0 ? { authorId: ticket.authorId, createdAt: ticket.createdAt } : messages[i - 1];
          const grouped =
            prev.authorId === m.authorId && Date.parse(m.createdAt) - Date.parse(prev.createdAt) < GROUP_WINDOW_MS;
          return (
            <MessageBubble
              key={m.id}
              author={m.authorName}
              role={m.authorRole}
              body={m.body}
              createdAt={m.createdAt}
              mine={m.authorId === me.id}
              grouped={grouped}
            />
          );
        })}
      </ScrollShadow>

      <div className="border-t border-separator bg-surface-secondary/50 p-3 sm:p-4">
        {closed ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LockSimpleIcon size={18} />
            {t.thread.closedNotice}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex flex-col gap-2"
          >
            <TextArea
              aria-label={t.thread.yourReply}
              // Empty, dir="auto" would turn the Persian placeholder left-to-right.
              dir={body ? "auto" : "rtl"}
              rows={3}
              fullWidth
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends and Shift+Enter makes a new line, but only with a mouse or trackpad: touch
                // keyboards have no Shift+Enter, so on phones Enter is a new line and the button sends.
                // Enter is also ignored while an IME is still composing a word.
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing &&
                  window.matchMedia("(pointer: fine)").matches
                ) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t.thread.replyPlaceholder}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="hidden items-center gap-1.5 text-xs text-muted pointer-fine:flex">
                <Kbd dir="ltr">
                  <Kbd.Content>Enter</Kbd.Content>
                </Kbd>
                {t.thread.sendHint}
              </span>
              <LoadingButton
                type="submit"
                variant="primary"
                isPending={send.isPending}
                isDisabled={body.trim() === ""}
                icon={<PaperPlaneTiltIcon size={18} />}
                className="ms-auto"
              >
                {t.thread.send}
              </LoadingButton>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

/** Placeholder replies while the thread loads, on alternating sides like real ones. */
function MessagesSkeleton() {
  return (
    <>
      {[false, true].map((mine) => (
        <div key={String(mine)} className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
          <Skeleton className="size-8 shrink-0 rounded-[calc(var(--radius)*2)]" />
          <div className={`flex w-full max-w-[82%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-12 w-3/4 rounded-2xl" />
          </div>
        </div>
      ))}
    </>
  );
}
