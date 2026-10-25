import { groupEvents } from "../channels/decisions.ts";
import { resultKind } from "../results/results.ts";
import type { Ruling } from "./types.ts";
import { slugify } from "../time.ts";
import type { EventSchedule, Session } from "../types.ts";

/** Rulings are watched for this long after a weekend's last result session. */
export const RULINGS_WINDOW_MS = 24 * 3_600_000;

const MAX_FACT = 300;

/** The FIA's session names → our F1 session ids. */
const FIA_SESSION: Record<string, string> = {
  qualifying: "qualifying",
  "sprint qualifying": "sprint-qualification",
  "sprint qualification": "sprint-qualification",
  sprint: "sprint-race",
  race: "race",
};

/**
 * The F1 weekend whose rulings are being watched: from the end of its first result session
 * (sprint qualifying or qualifying) until a day after its last (the race).
 */
export function rulingsEvent(sessions: Session[], now: number): EventSchedule | null {
  for (const event of groupEvents(sessions)) {
    const ends = event.sessions
      .filter((s) => resultKind(s.series, s.sessionId) !== null)
      .map((s) => s.end.getTime());
    if (ends.length === 0) continue;
    if (Math.min(...ends) <= now && now < Math.max(...ends) + RULINGS_WINDOW_MS) return event;
  }
  return null;
}

const normalize = (name: string): string =>
  name
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, "");

/** The FIA page's event ("Sao Paulo Grand Prix") is our event ("São Paulo Grand Prix"). */
export const matchesEvent = (fiaEvent: string | null, eventName: string): boolean =>
  fiaEvent !== null && normalize(fiaEvent) === normalize(eventName);

/**
 * A ruling about a qualifying, sprint or race published after that session ended: decided
 * once the broadcast was over, so it can change the result or the grid.
 */
export function isPostSession(
  fiaSession: string,
  publishedAt: Date,
  eventSessions: Session[],
): boolean {
  const sessionId = FIA_SESSION[fiaSession.trim().toLowerCase()];
  const session = eventSessions.find((s) => s.sessionId === sessionId);
  return session !== undefined && publishedAt.getTime() > session.end.getTime();
}

export const isPenalty = (decision: string): boolean =>
  !/^no (further action|penalty|action)/i.test(decision.trim());

const cut = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/** Penalties get the full post; anything else is one short line. */
export function renderRuling(r: Ruling, summary: string | null): string {
  const who = `${r.driver} · Car ${r.car} · ${r.session}`;
  const fact = cut(r.fact, MAX_FACT);
  if (!isPenalty(r.decision)) return `⚖️ ${who}: ${fact} → ${r.decision}`;
  return [
    `⚖️ **${r.driver}** · Car ${r.car} · ${r.session}`,
    `${fact} → **${r.decision}**`,
    ...(summary ? [`> ${squashLines(summary)}`] : []),
  ].join("\n");
}

const squashLines = (text: string): string => text.replaceAll(/\s*\n\s*/g, " ").trim();

/** The document's text as an attachment Discord previews inline. */
export const rulingFile = (title: string, text: string): { name: string; data: string } => ({
  name: `${slugify(title)}.txt`,
  data: text,
});

export function summaryPrompt(r: Ruling): string {
  return [
    "Summarize this FIA stewards' ruling for F1 fans in at most two short sentences: what happened and why the stewards decided as they did.",
    "Plain text, no preamble, don't repeat the driver's name or car number.",
    "",
    `Driver: ${r.driver} (car ${r.car}, ${r.competitor})`,
    `Session: ${r.session}`,
    `Fact: ${r.fact}`,
    `Infringement: ${r.infringement}`,
    `Decision: ${r.decision}`,
    `Reason: ${r.reason}`,
  ].join("\n");
}
