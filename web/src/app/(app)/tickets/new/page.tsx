"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Description, FieldError, Input, Label, TextArea, TextField, toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingButton } from "@/components/LoadingButton";
import { PageHeader } from "@/components/PageHeader";
import { SelectField } from "@/components/SelectField";
import { api } from "@/lib/api-client";
import { PRIORITIES, type Priority } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { useMe } from "@/lib/hooks/use-me";
import { t } from "@/lib/strings.fa";

const priorityOptions = PRIORITIES.map((id) => ({ id, label: t.priority[id] }));

// The same limits as createTicketSchema in lib/validation/tickets.ts.
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 5000;

/** "۲۵ از ۱۲۰": how much of the limit is used. */
function counter(length: number, max: number) {
  return `${length.toLocaleString("fa-IR")} از ${max.toLocaleString("fa-IR")}`;
}

export default function NewTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string | null>("medium");
  const [discarding, setDiscarding] = useState(false);

  // Only clients create tickets; agents are sent back to the list.
  useEffect(() => {
    if (me && me.role !== "client") router.replace("/tickets");
  }, [me, router]);

  const create = useMutation({
    mutationFn: () =>
      api<{ id: string }>("/api/tickets", {
        method: "POST",
        json: { title, description, priority: priority as Priority },
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(t.tickets.created);
      router.push(`/tickets/${result.id}`);
    },
    onError: (err) => toast.danger(errorMessage(err)),
  });

  const dirty = (title.trim() !== "" || description.trim() !== "") && !create.isSuccess;

  // Reloading or closing the tab with text in the form asks first. In-app links cannot be stopped this way;
  // the Cancel button asks with its own dialog.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <div className="max-w-2xl">
      <PageHeader title={t.tickets.newTitle} description={t.tickets.newHint} />
      <form
        className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-[var(--surface-shadow)] sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!create.isPending) create.mutate();
        }}
      >
        <TextField
          fullWidth
          isRequired
          maxLength={TITLE_MAX}
          validate={(v) => (v.trim().length < 3 ? t.tickets.titleTooShort : null)}
          value={title}
          onChange={setTitle}
        >
          <Label>{t.tickets.fieldTitle}</Label>
          {/* Empty, dir="auto" would turn the Persian placeholder left-to-right. */}
          <Input dir={title ? "auto" : "rtl"} placeholder={t.tickets.titlePlaceholder} />
          <Description className="tabular-nums">{counter(title.length, TITLE_MAX)}</Description>
          <FieldError />
        </TextField>
        <TextField
          fullWidth
          isRequired
          maxLength={DESCRIPTION_MAX}
          validate={(v) => (v.trim().length < 10 ? t.tickets.descriptionTooShort : null)}
          value={description}
          onChange={setDescription}
        >
          <Label>{t.tickets.fieldDescription}</Label>
          <TextArea dir={description ? "auto" : "rtl"} rows={7} placeholder={t.tickets.descriptionPlaceholder} />
          <Description className="flex justify-between gap-3">
            <span>{t.tickets.descriptionHint}</span>
            <span className="tabular-nums">{counter(description.length, DESCRIPTION_MAX)}</span>
          </Description>
          <FieldError />
        </TextField>
        <SelectField
          label={t.tickets.fieldPriority}
          value={priority}
          options={priorityOptions}
          onChange={setPriority}
          className="sm:w-56"
        />
        <div className="flex items-center justify-end gap-2 border-t border-separator pt-5">
          <Button variant="tertiary" onPress={() => (dirty ? setDiscarding(true) : router.push("/tickets"))}>
            {t.common.cancel}
          </Button>
          <LoadingButton type="submit" variant="primary" isPending={create.isPending}>
            {t.tickets.submit}
          </LoadingButton>
        </div>
      </form>
      <ConfirmDialog
        isOpen={discarding}
        onOpenChange={setDiscarding}
        title={t.tickets.discardTitle}
        text={t.tickets.discardText}
        confirmLabel={t.tickets.discardConfirm}
        cancelLabel={t.tickets.keepEditing}
        onConfirm={() => router.push("/tickets")}
      />
    </div>
  );
}
