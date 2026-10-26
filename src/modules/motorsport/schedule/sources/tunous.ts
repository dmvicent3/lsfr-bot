import type { Named, EventCtx } from "./types.ts";
import { isRecord, isString } from "../../../../core/guards.ts";
import { type ParsedSession, type SeriesKey, SourceFormatError } from "../../types.ts";
import { byStart, parseDate } from "./dates.ts";

/** An event or stage: it must have a string id and title. */
function named(value: unknown, what: string): Named {
  if (!isRecord(value) || !isString(value["id"]) || !isString(value["title"])) {
    throw new SourceFormatError(`${what} without id/title`);
  }

  return { ...value, id: value["id"], title: value["title"] };
}

function stageSession({ series, year, event }: EventCtx, raw: unknown): ParsedSession {
  const stage = named(raw, `${series}/${event.id}: stage`);
  const where = `${series}/${event.id}/${stage.id}`;

  return {
    series,
    eventId: `${year}-${event.id}`,
    eventName: event.title,
    sessionId: stage.id,
    title: stage.title,
    start: parseDate(stage["startDate"], where),
    end: parseDate(stage["endDate"], where),
    significant: stage["isSignificant"] === true,
  };
}

/** An event's sessions in start order; none when it's cancelled. */
function eventSessions(series: SeriesKey, year: number, raw: unknown): ParsedSession[] {
  const event = named(raw, `${series}: event`);

  if (event["isCancelled"] === true) return [];

  const stages = event["stages"];

  if (!Array.isArray(stages)) throw new SourceFormatError(`${series}/${event.id}: no stages`);

  return stages.map((s: unknown) => stageSession({ series, year, event }, s)).toSorted(byStart);
}

/** Event IDs are prefixed with the season year: source ids repeat every season. */
export function parseTunous(series: SeriesKey, year: number, json: unknown): ParsedSession[] {
  if (!Array.isArray(json)) throw new SourceFormatError(`${series}: expected an array of events`);

  return json.flatMap((event: unknown) => eventSessions(series, year, event));
}
