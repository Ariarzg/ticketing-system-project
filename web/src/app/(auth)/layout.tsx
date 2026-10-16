import { ChatsCircleIcon, ClockCountdownIcon, ListChecksIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { t } from "@/lib/strings.fa";

const points = [
  { icon: ListChecksIcon, text: t.authPanel.point1 },
  { icon: ClockCountdownIcon, text: t.authPanel.point2 },
  { icon: ChatsCircleIcon, text: t.authPanel.point3 },
];

/** Form on the start side, a calm brand panel on the other. The panel is hidden on small screens. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">{children}</div>
      </main>

      <aside className="brand-panel hidden flex-col justify-end gap-8 border-s border-border p-12 lg:flex">
        <div className="max-w-md">
          <h2 className="text-4xl font-bold leading-snug tracking-tight">{t.authPanel.headline}</h2>
          <p className="mt-3 text-base leading-relaxed text-muted">{t.authPanel.sub}</p>
        </div>
        <ul className="flex max-w-md flex-col gap-4">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-accent shadow-[var(--surface-shadow)]">
                <Icon size={20} />
              </span>
              <span className="text-sm font-medium">{text}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}