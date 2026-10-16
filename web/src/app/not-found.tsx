import Link from "next/link";
import { CompassIcon } from "@phosphor-icons/react/dist/ssr";
// From @heroui/styles, not @heroui/react: this is a server component and only needs the class names.
import { buttonVariants } from "@heroui/styles";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { t } from "@/lib/strings.fa";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-6 sm:px-10">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 pb-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-surface-secondary text-muted">
          <CompassIcon size={28} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{t.errors.notFoundTitle}</h1>
          <p className="mt-2 text-muted">{t.errors.notFoundText}</p>
        </div>
        <Link href="/tickets" className={buttonVariants({ variant: "primary" })}>
          {t.errors.backHome}
        </Link>
      </main>
    </div>
  );
}
