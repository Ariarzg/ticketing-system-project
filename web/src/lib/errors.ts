import { ApiError } from "./api-client";
import { t } from "./strings.fa";

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const known = (t.errors as Record<string, string>)[err.code];
    if (known) return known;
  }
  return t.errors.server;
}
