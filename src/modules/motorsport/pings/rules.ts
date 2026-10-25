import type { ParsedSession, SeriesKey, Session } from "../types.ts";

const PINGABLE_IDS: Partial<Record<SeriesKey, ReadonlySet<string>>> = {
  f1: new Set(["sprint-qualification", "sprint-race", "qualifying", "race"]),
  f2: new Set(["qualifying", "sprint", "feature"]),
  f3: new Set(["qualifying", "sprint", "feature"]),
  fe: new Set(["qualifying", "race"]),
  indycar: new Set(["qualifying", "race"]),
  motogp: new Set(["qualifying1", "sprint", "race"]),
};

const WRC_STAGE = /^s?ss\d+$/;

/** WRC: the earliest special stage of each UTC day, per rally. */
function wrcFirstStages(sessions: ParsedSession[]): Set<ParsedSession> {
  const firsts = new Map<string, ParsedSession>();
  for (const s of sessions) {
    if (s.series !== "wrc" || !WRC_STAGE.test(s.sessionId)) continue;
    const day = `${s.eventId}/${s.start.toISOString().slice(0, 10)}`;
    const current = firsts.get(day);
    if (!current || s.start < current.start) firsts.set(day, s);
  }
  return new Set(firsts.values());
}

export function applyRules(sessions: ParsedSession[]): Session[] {
  const wrcFirsts = wrcFirstStages(sessions);
  return sessions.map((parsed) => {
    const { significant, ...session } = parsed;
    let pingable: boolean;
    if (session.series === "wec") pingable = significant;
    else if (session.series === "wrc") pingable = wrcFirsts.has(parsed);
    else pingable = PINGABLE_IDS[session.series]?.has(session.sessionId) ?? false;
    return { ...session, pingable };
  });
}
