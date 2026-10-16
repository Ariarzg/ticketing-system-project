"use client";

import { useState } from "react";
import { Button, Description, FieldError, InputGroup, Label, TextField } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { t } from "@/lib/strings.fa";

/** The password field of login and signup, with a button that shows or hides what was typed. */
export function PasswordField({
  value,
  onChange,
  validate,
  autoComplete,
  hint,
  isRequired = false,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Returns a Persian error message, or null when the value is fine. */
  validate: (value: string) => string | null;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  isRequired?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      fullWidth
      isRequired={isRequired}
      name="password"
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      validate={validate}
    >
      <Label>{t.auth.password}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input dir="ltr" autoComplete={autoComplete} spellCheck={false} />
        <InputGroup.Suffix>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
            onPress={() => setVisible((v) => !v)}
          >
            {visible ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {hint && <Description>{hint}</Description>}
      <FieldError />
    </TextField>
  );
}
