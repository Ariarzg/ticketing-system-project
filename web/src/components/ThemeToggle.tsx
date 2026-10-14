"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@heroui/react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { t } from "@/lib/strings.fa";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  // Reads the real <html> class, so it always matches what the inline script in layout.tsx set.
  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  function toggle() {
    const next = !isDark;
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    root.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode: the choice just will not be remembered.
    }
  }

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={isDark ? t.theme.toLight : t.theme.toDark}
      onPress={toggle}
    >
      {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </Button>
  );
}
