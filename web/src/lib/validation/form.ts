import { t } from "../strings.fa";
import { loginSchema } from "./auth";

/** Shown under the email field. Uses the API's own email rule, so the form and the server agree. */
export function checkEmail(value: string): string | null {
  if (!value.trim()) return t.auth.emailRequired;
  return loginSchema.shape.email.safeParse(value).success ? null : t.auth.emailInvalid;
}
