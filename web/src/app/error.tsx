"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@heroui/react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { t } from "@/lib/strings.fa";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-6 sm:px-10">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 pb-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger">
          <WarningCircleIcon size={28} />
        </span>
        <h1 className="text-xl font-bold">{t.errors.server}</h1>
        {/* Retry first; if it keeps failing, a way out to the list. */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" onPress={reset}>
            {t.common.retry}
          </Button>
          <Link href="/tickets" className={buttonVariants({ variant: "tertiary" })}>
            {t.errors.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
