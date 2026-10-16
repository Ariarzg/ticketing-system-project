"use client";

import { useEffect, useRef, useState } from "react";
import { Kbd, Skeleton, TextArea } from "@heroui/react";
import { LockSimpleIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useMessages, useSendMessage } from "@/lib/hooks/use-messages";
import type { MeUser } from "@/lib/hooks/use-me";
import type { TicketDto } from "@/lib/hooks/use-tickets";
import { t } from "@/lib/strings.fa";
import { LoadingButton } from "./LoadingButton";
import { MessageBubble } from "./MessageBubble";

export function Thread({ ticket, me }: { ticket: TicketDto; me: MeUser }) {
  const { data: messages, isLoading } = useMessages(ticket.id);
  const send = useSendMessage(ticket.id);
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const count = messages?.length ?? 0;
  const closed = ticket.status === "closed";

  // Scroll to the newest message when the number of messages changes.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  function submit() {
    const text = body.trim();
    if (!text || send.isPending) return;
    send.mutate(text, { onSuccess: () => setBody("") });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--surface-shadow)]">
      <div ref={listRef} className="flex max-h-[32rem] min-h-48 flex-col gap-5 overflow-y-auto p-4 sm:p-5">
        {/* The description is the first bubble of the thread (D17). */}
        <MessageBubble
          author={ticket.authorName}
          body={ticket.description}
          createdAt={ticket.createdAt}
          mine={ticket.authorId === me.id}
        />
        {isLoading && <MessagesSkeleton />}
        {messages?.map((m) => (
          <MessageBubble
            key={m.id}
            author={m.authorName}
            role={m.authorRole}
            body={m.body}
            createdAt={m.createdAt}
            mine={m.authorId === me.id}
          />
        ))}
      </div>

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
              dir="auto"
              rows={3}
              fullWidth
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter makes a new line; ignore Enter while an IME is still composing a word.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t.thread.replyPlaceholder}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
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
