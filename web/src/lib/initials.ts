/**
 * "علی رضایی" -> "ع‌ر", "Sara Ahmadi" -> "SA". Used for avatars.
 * Persian letters join, so two initials side by side would read as a word ("تیم پشتیبانی" -> "تپ");
 * a zero-width non-joiner keeps them apart and is invisible between Latin letters.
 * Array.from takes whole characters, so an emoji is not cut in half.
 */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = Array.from(parts[0] ?? "")[0] ?? "?";
  const second = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : "";
  return (second ? `${first}‌${second}` : first).toUpperCase();
}
