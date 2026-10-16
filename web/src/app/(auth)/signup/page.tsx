"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FieldError, Input, Label, TextField, toast } from "@heroui/react";
import { SelectField } from "@/components/SelectField";
import { LoadingButton } from "@/components/LoadingButton";
import { PasswordField } from "@/components/PasswordField";
import { api } from "@/lib/api-client";
import { DEPARTMENTS } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { t } from "@/lib/strings.fa";
import { checkEmail } from "@/lib/validation/form";

const departmentOptions = DEPARTMENTS.map((id) => ({ id, label: t.department[id] }));

// The same limits as signupSchema in lib/validation/auth.ts.
const checkName = (v: string) => (v.trim().length < 2 ? t.auth.nameRequired : null);
const checkPassword = (v: string) => (!v ? t.auth.passwordRequired : v.length < 8 ? t.auth.passwordTooShort : null);

export default function SignupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // The department select is required, so the form does not submit without it; this only narrows the type.
    if (pending || !department) return; // isPending keeps the button focusable, so Enter in a field could still submit twice
    setPending(true);
    try {
      await api("/api/auth/signup", {
        method: "POST",
        json: { name, email, password, department },
      });
      queryClient.clear();
      toast.clear();
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
        <h1 className="text-3xl font-bold tracking-tight">{t.auth.signupTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.auth.signupHint}</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField fullWidth isRequired name="name" value={name} onChange={setName} validate={checkName}>
          <Label>{t.auth.name}</Label>
          <Input dir="auto" className="text-right" autoComplete="name" />
          <FieldError />
        </TextField>
        <TextField fullWidth isRequired name="email" type="email" value={email} onChange={setEmail} validate={checkEmail}>
          <Label>{t.auth.email}</Label>
          <Input dir="ltr" autoComplete="email" spellCheck={false} placeholder="name@example.com" />
          <FieldError />
        </TextField>
        <PasswordField
          value={password}
          onChange={setPassword}
          validate={checkPassword}
          autoComplete="new-password"
          hint={t.auth.passwordHint}
          isRequired
        />
        <SelectField
          label={t.auth.department}
          placeholder={t.auth.departmentPlaceholder}
          value={department}
          options={departmentOptions}
          onChange={setDepartment}
          requiredMessage={t.auth.departmentRequired}
        />
        <LoadingButton type="submit" variant="primary" size="lg" fullWidth isPending={pending} className="mt-2">
          {t.auth.signupButton}
        </LoadingButton>
      </form>
      <p className="text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-accent-soft-foreground hover:underline">
          {t.auth.loginTitle}
        </Link>
      </p>
    </>
  );
}
