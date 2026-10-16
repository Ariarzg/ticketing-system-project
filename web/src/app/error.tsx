"use client";

import { Button } from "@heroui/react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { t } from "@/lib/strings.fa";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger">
        <WarningCircleIcon size={28} />
      </span>
      <h1 className="text-xl font-bold">{t.errors.server}</h1>
      <Button variant="primary" onPress={reset}>
        {t.common.retry}
      </Button>
    </main>
  );
}
