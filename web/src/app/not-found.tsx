import Link from "next/link";
import { CompassIcon } from "@phosphor-icons/react/dist/ssr";
import { t } from "@/lib/strings.fa";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-surface-secondary text-muted">
        <CompassIcon size={28} />
      </span>
      <div>
        <h1 className="text-2xl font-bold">{t.errors.notFoundTitle}</h1>
        <p className="mt-2 text-muted">{t.errors.notFoundText}</p>
      </div>
      <Link
        href="/tickets"
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        {t.errors.backHome}
      </Link>
    </main>
  );
}
