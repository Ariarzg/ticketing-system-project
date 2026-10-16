"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FieldError, Input, Label, TextField, toast } from "@heroui/react";
import { LoadingButton } from "@/components/LoadingButton";
import { PasswordField } from "@/components/PasswordField";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { t } from "@/lib/strings.fa";
import { checkEmail } from "@/lib/validation/form";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return; // isPending keeps the button focusable, so Enter in a field could still submit twice
    setPending(true);
    try {
      await api("/api/auth/login", { method: "POST", json: { email, password } });
      queryClient.clear(); // forget anything cached for a previous user
      toast.clear(); // an error from an earlier attempt should not follow the user in
      router.replace("/tickets");
    } catch (err) {
      toast.danger(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  // No isRequired here: two fields need no asterisks. `validate` still blocks an empty submit with a Persian message.
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.auth.loginTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.auth.loginHint}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField fullWidth name="email" type="email" value={email} onChange={setEmail} validate={checkEmail}>
          <Label>{t.auth.email}</Label>
          <Input dir="ltr" autoComplete="email" spellCheck={false} placeholder="name@example.com" />
          <FieldError />
        </TextField>
        <PasswordField
          value={password}
          onChange={setPassword}
          validate={(v) => (v ? null : t.auth.passwordRequired)}
          autoComplete="current-password"
        />
        <LoadingButton type="submit" variant="primary" size="lg" fullWidth isPending={pending} className="mt-2">
          {t.auth.loginButton}
        </LoadingButton>
      </form>
      <p className="text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-accent-soft-foreground hover:underline">
          {t.auth.signupTitle}
        </Link>
      </p>
    </>
  );
}
