"use client";

import { AlertDialog, Button } from "@heroui/react";
import { t } from "@/lib/strings.fa";

/**
 * A Persian, right-to-left confirmation in the app's own style, used instead of the browser's confirm()
 * (whose buttons follow the browser language and ignore the theme). Controlled: the caller opens it.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  text,
  confirmLabel,
  cancelLabel = t.common.cancel,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Container size="sm">
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>{text}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary">
              {cancelLabel}
            </Button>
            <Button slot="close" variant="danger" onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
