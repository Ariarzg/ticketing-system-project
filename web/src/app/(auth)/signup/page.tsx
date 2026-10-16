"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Description, Input, Label, TextField, toast } from "@heroui/react";
import { SelectField } from "@/components/SelectField";
import { api } from "@/lib/api-client";
import { DEPARTMENTS } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { t } from "@/lib/strings.fa";

const departmentOptions = DEPARTMENTS.map((id) => ({ id, label: t.department[id] }));

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
    if (!department) {
      toast.danger(t.auth.departmentRequired);
      return;
    }
    setPending(true);
    try {
      await api("/api/auth/signup", {
        method: "POST",
        json: { name, email, password, department },
      });
      queryClient.clear();
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
        <TextField fullWidth isRequired value={name} onChange={setName}>
          <Label>{t.auth.name}</Label>
          <Input autoComplete="name" />
        </TextField>
        <TextField fullWidth isRequired value={email} onChange={setEmail} type="email">
          <Label>{t.auth.email}</Label>
          <Input dir="ltr" autoComplete="email" placeholder="name@example.com" />
        </TextField>
        <TextField fullWidth isRequired value={password} onChange={setPassword} type="password">
          <Label>{t.auth.password}</Label>
          <Input dir="ltr" autoComplete="new-password" />
          <Description>{t.auth.passwordHint}</Description>
        </TextField>
        <SelectField
          label={t.auth.department}
          placeholder={t.auth.departmentPlaceholder}
          value={department}
          options={departmentOptions}
          onChange={setDepartment}
        />
        <Button type="submit" variant="primary" size="lg" fullWidth isDisabled={pending} className="mt-2">
          {t.auth.signupButton}
        </Button>
      </form>
      <p className="text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          {t.auth.loginTitle}
        </Link>
      </p>
    </>
  );
}