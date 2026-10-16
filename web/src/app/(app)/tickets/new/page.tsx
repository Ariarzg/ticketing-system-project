"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Description, FieldError, Input, Label, TextArea, TextField, toast } from "@heroui/react";
import { LoadingButton } from "@/components/LoadingButton";
import { PageHeader } from "@/components/PageHeader";
import { SelectField } from "@/components/SelectField";
import { api } from "@/lib/api-client";
import { PRIORITIES, type Priority } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { useMe } from "@/lib/hooks/use-me";
import { t } from "@/lib/strings.fa";

const priorityOptions = PRIORITIES.map((id) => ({ id, label: t.priority[id] }));

export default function NewTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string | null>("medium");

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

  return (
    <div className="mx-auto max-w-2xl">
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
          maxLength={120}
          validate={(v) => (v.trim().length < 3 ? t.tickets.titleTooShort : null)}
          value={title}
          onChange={setTitle}
        >
          <Label>{t.tickets.fieldTitle}</Label>
          <Input dir="auto" placeholder={t.tickets.titlePlaceholder} />
          <FieldError />
        </TextField>
        <TextField
          fullWidth
          isRequired
          maxLength={5000}
          validate={(v) => (v.trim().length < 10 ? t.tickets.descriptionTooShort : null)}
          value={description}
          onChange={setDescription}
        >
          <Label>{t.tickets.fieldDescription}</Label>
          <TextArea dir="auto" rows={7} placeholder={t.tickets.descriptionPlaceholder} />
          <Description>{t.tickets.descriptionHint}</Description>
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
          <Button variant="tertiary" onPress={() => router.push("/tickets")}>
            {t.common.cancel}
          </Button>
          <LoadingButton type="submit" variant="primary" isPending={create.isPending}>
            {t.tickets.submit}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
