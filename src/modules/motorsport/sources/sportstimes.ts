import { isRecord, isString } from "../../../core/guards.ts";
import { type ParsedSession, type SeriesKey, SourceFormatError } from "../types.ts";
import { byStart, parseDate } from "./dates.ts";
import { defaultDurationMs, sessionTitle } from "./titles.ts";

export function parseSportstimes(series: SeriesKey, json: unknown): ParsedSession[] {
  if (!isRecord(json) || !Array.isArray(json["races"])) {
    throw new SourceFormatError(`${series}: expected { races: [...] }`);
  }
  const sessions: ParsedSession[] = [];
  for (const race of json["races"] as unknown[]) {
    if (!isRecord(race)) throw new SourceFormatError(`${series}: race is not an object`);
    const { name, slug, sessions: times } = race;
    if (!isString(name) || !isString(slug)) {
      throw new SourceFormatError(`${series}: race without name/slug`);
    }
    if (!isRecord(times)) throw new SourceFormatError(`${series}/${slug}: no sessions`);
    const raceSessions = Object.entries(times).map(([key, value]): ParsedSession => {
      const start = parseDate(value, `${series}/${slug}/${key}`);
      return {
        series,
        eventId: slug,
        eventName: name,
        sessionId: key,
        title: sessionTitle(key),
        start,
        end: new Date(start.getTime() + defaultDurationMs(key)),
        significant: false,
      };
    });
    sessions.push(...raceSessions.toSorted(byStart));
  }
  return sessions;
}
