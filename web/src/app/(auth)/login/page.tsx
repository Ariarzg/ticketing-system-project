"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Input, Label, TextField, toast } from "@heroui/react";
import { LoadingButton } from "@/components/LoadingButton";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { t } from "@/lib/strings.fa";

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
      router.replace("/tickets");
    } catch (err) {
      toast.danger(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.auth.loginTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.auth.loginHint}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField fullWidth isRequired value={email} onChange={setEmail} type="email">
          <Label>{t.auth.email}</Label>
          <Input dir="ltr" autoComplete="email" placeholder="name@example.com" />
        </TextField>
        <TextField fullWidth isRequired value={password} onChange={setPassword} type="password">
          <Label>{t.auth.password}</Label>
          <Input dir="ltr" autoComplete="current-password" />
        </TextField>
        <LoadingButton type="submit" variant="primary" size="lg" fullWidth isPending={pending} className="mt-2">
          {t.auth.loginButton}
        </LoadingButton>
      </form>
      <p className="text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-accent hover:underline">
          {t.auth.signupTitle}
        </Link>
      </p>
    </>
  );
}
