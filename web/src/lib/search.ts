/** Turns user text into a safe `%text%` pattern for ILIKE. */
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, "\\$&")}%`;
}