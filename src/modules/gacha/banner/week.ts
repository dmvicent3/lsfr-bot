import { DAY_MS, dateOfMs, dayMs } from "../../../core/periods.ts";
import { dateIn, wallToInstant } from "../../../core/zoned.ts";
import type { Week } from "./types.ts";

const HOUR_MS = 3_600_000;
/** Polls go up on Thursday (three days after Monday) at noon. */
const POLL_DAY = 3;
const POLL_HOUR = 12;

/** The banner week holding instant `now` in `tz`. */
export function weekOf(now: number, tz: string): Week {
  const today = dayMs(dateIn(now, tz));
  const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY_MS;

  return {
    start: dateOfMs(monday),
    startsAt: wallToInstant(monday, tz),
    endsAt: wallToInstant(monday + 7 * DAY_MS, tz),
    pollsAt: wallToInstant(monday + POLL_DAY * DAY_MS + POLL_HOUR * HOUR_MS, tz),
  };
}

/** The Monday a week after `start`. */
export const nextWeekStart = (start: string): string => dateOfMs(dayMs(start) + 7 * DAY_MS);

/** Polls close this long before the reset, so the results are in when it comes. */
export const POLL_MARGIN_MS = HOUR_MS;

/**
 * How many whole hours a poll posted at `now` may run and still close an hour before the reset;
 * null when that is under an hour (too late to post this week).
 */
export function pollHours(now: number, week: Week): number | null {
  const hours = Math.floor((week.endsAt - POLL_MARGIN_MS - now) / HOUR_MS);

  return hours >= 1 ? hours : null;
}

/** Whether the polls for next week should go up now: past Thursday noon with time left. */
export const pollsDue = (now: number, week: Week): boolean =>
  now >= week.pollsAt && pollHours(now, week) !== null;
