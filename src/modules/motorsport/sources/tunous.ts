import { isRecord, isString } from "../../../core/guards.ts";
import { type ParsedSession, type SeriesKey, SourceFormatError } from "../types.ts";
import { byStart, parseDate } from "./dates.ts";

/** Event IDs are prefixed with the season year: source ids repeat every season. */
export function parseTunous(series: SeriesKey, year: number, json: unknown): ParsedSession[] {
  if (!Array.isArray(json)) throw new SourceFormatError(`${series}: expected an array of events`);
  const sessions: ParsedSession[] = [];
  for (const event of json as unknown[]) {
    if (!isRecord(event) || !isString(event["id"]) || !isString(event["title"])) {
      throw new SourceFormatError(`${series}: event without id/title`);
    }
    if (event["isCancelled"] === true) continue;
    const stages = event["stages"];
    if (!Array.isArray(stages)) throw new SourceFormatError(`${series}/${event["id"]}: no stages`);
    const eventSessions: ParsedSession[] = [];
    for (const stage of stages as unknown[]) {
      if (!isRecord(stage) || !isString(stage["id"]) || !isString(stage["title"])) {
        throw new SourceFormatError(`${series}/${event["id"]}: stage without id/title`);
      }
      const where = `${series}/${event["id"]}/${stage["id"]}`;
      eventSessions.push({
        series,
        eventId: `${year}-${event["id"]}`,
        eventName: event["title"],
        sessionId: stage["id"],
        title: stage["title"],
        start: parseDate(stage["startDate"], where),
        end: parseDate(stage["endDate"], where),
        significant: stage["isSignificant"] === true,
      });
    }
    sessions.push(...eventSessions.toSorted(byStart));
  }
  return sessions;
}
