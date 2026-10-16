"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Drawer, Skeleton, useOverlayState } from "@heroui/react";
import { ListIcon, SignOutIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api } from "@/lib/api-client";
import { useMe, type MeUser } from "@/lib/hooks/use-me";
import { initials } from "@/lib/initials";
import { t } from "@/lib/strings.fa";

function UserBlock({ me, onLogout }: { me: MeUser; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <Avatar size="sm" color="accent" variant="soft">
        <Avatar.Fallback>{initials(me.name)}</Avatar.Fallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{me.name}</p>
        <p className="text-xs text-muted">{t.role[me.role]}</p>
      </div>
      <Button isIconOnly size="sm" variant="ghost" aria-label={t.auth.logout} onPress={onLogout}>
        <SignOutIcon size={18} />
      </Button>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh lg:ps-72">
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const drawer = useOverlayState();
  const { data: me, isError, refetch } = useMe();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    router.replace("/login");
  }

  if (isError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <p>{t.errors.server}</p>
        <Button onPress={() => refetch()}>{t.common.retry}</Button>
      </div>
    );
  }

  if (!me) return <ShellSkeleton />;

  return (
    <div className="min-h-dvh">
      {/* Desktop: fixed sidebar on the start side (the right in RTL). */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-72 flex-col gap-6 border-e border-border bg-background p-4 lg:flex">
        <div className="px-2 pt-2">
          <Logo />
        </div>
        <NavLinks me={me} />
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted">{t.theme.label}</span>
            <ThemeToggle />
          </div>
          <UserBlock me={me} onLogout={logout} />
        </div>
      </aside>

      {/* Mobile and tablet: top bar, with a drawer that holds the same navigation. */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Drawer state={drawer}>
          <Button isIconOnly size="sm" variant="ghost" aria-label={t.nav.menu}>
            <ListIcon size={20} />
          </Button>
          <Drawer.Backdrop>
            {/* In RTL the placement follows the reading direction, so "left" opens from the start side (the right). */}
            <Drawer.Content placement="left">
              <Drawer.Dialog>
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <Drawer.Heading>
                    <Logo />
                  </Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body className="flex flex-col gap-6">
                  <NavLinks me={me} onNavigate={drawer.close} />
                  <div className="mt-auto">
                    <UserBlock me={me} onLogout={logout} />
                  </div>
                </Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
        <Logo className="text-sm" />
        <span className="flex-1" />
        <ThemeToggle />
      </header>

      <main className="lg:ps-72">
        <div className="rise mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}