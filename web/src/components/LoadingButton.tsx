"use client";

import { Button, Spinner, type ButtonProps } from "@heroui/react";
import { t } from "@/lib/strings.fa";

type Props = Omit<ButtonProps, "children" | "isPending"> & {
  isPending?: boolean;
  /** Shown before the label. While the button is pending it is replaced by a spinner. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

/** A HeroUI button that shows a spinner and ignores presses while `isPending` is true. */
export function LoadingButton({ isPending = false, icon, children, ...props }: Props) {
  return (
    <Button {...props} isPending={isPending}>
      {isPending ? <Spinner size="sm" color="current" aria-label={t.common.loading} /> : icon}
      {children}
    </Button>
  );
}
