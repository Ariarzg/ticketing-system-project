import { ChatsCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { t } from "@/lib/strings.fa";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${className}`}>
      <span className="grid size-8 place-items-center rounded-xl bg-accent text-accent-foreground">
        <ChatsCircleIcon size={18} weight="fill" />
      </span>
      {t.appName}
    </span>
  );
}