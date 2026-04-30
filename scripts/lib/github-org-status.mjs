/**
 * Combined readout for GET /api/github-org-status (command center + operator desk).
 */
import { getGithubOrgValve } from "./github-org-valve.mjs";
import { readRecentSocialEvents } from "./p31-social-events.mjs";

export function getGithubOrgStatus() {
  const valve = getGithubOrgValve();
  const recent = readRecentSocialEvents(96).filter((e) => {
    const k = e && typeof e.kind === "string" ? e.kind : "";
    return k.startsWith("github-org.");
  });
  const last = recent.length ? recent[recent.length - 1] : null;
  return {
    ok: true,
    schema: "p31.githubOrgStatus/1.0.0",
    valve: {
      mode: valve.mode,
      updatedAt: valve.updatedAt ?? null,
      note: valve.note ?? null,
      pathHint: "~/.p31/github-org-valve.json",
    },
    lastEvent: last,
    recentCount: recent.length,
    recentTail: recent.slice(-12),
  };
}
