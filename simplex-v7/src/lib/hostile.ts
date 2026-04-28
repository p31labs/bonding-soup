/** newline / comma separated — lowercased emails for routing */
export function parseHostileSecret(raw: string | undefined): Set<string> {
  const t = (raw ?? '').trim();
  if (!t.length) return new Set();
  return new Set(t.split(/[\n\r,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean));
}
