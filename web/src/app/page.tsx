"use client";

import { Button, toast } from "@heroui/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { t } from "@/lib/strings.fa";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t.appName}</h1>
        <ThemeToggle />
      </div>
      <p className="mb-6 text-muted">{t.dev.hello}</p>
      <Button variant="primary" onPress={() => toast.success(t.dev.toast)}>
        {t.dev.button}
      </Button>
    </main>
  );
}
