import type { Clock, Today, When } from "./types.ts";

export const TIME_ZONE = "Europe/Lisbon";

const UNIT_MS: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
const DURATION = /^(\d+\s*[mhdw]\s*)+$/;
/** "9:00" or "9h00"; a bare "9h" is a duration. */
const CLOCK = /^(\d{1,2})[:h](\d{2})$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\S+))?$/;
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MORNING: Clock = { h: 9, min: 0 };

/** The wall-clock fields of instant `t` in `tz`. */
function wallOf(t: number, tz: string): Record<string, number> {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return Object.fromEntries(fmt.formatToParts(t).map((p) => [p.type, Number(p.value)]));
}

/** How far `tz`'s wall clock is ahead of UTC at instant `t`, in ms. */
function offsetAt(t: number, tz: string): number {
  const w = wallOf(t, tz);
  const wall = Date.UTC(w["year"] ?? 0, (w["month"] ?? 1) - 1, w["day"], w["hour"], w["minute"]);

  return wall - (t - (t % 60_000));
}

/** A wall-clock time (as if UTC) to an instant; the second pass settles the DST switch hours. */
function wallToInstant(wall: number, tz: string): number {
  return wall - offsetAt(wall - offsetAt(wall, tz), tz);
}

function todayIn(now: number, tz: string): Today {
  const w = wallOf(now, tz);
  const [y, m, d] = [w["year"] ?? 0, w["month"] ?? 1, w["day"] ?? 1];

  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), now, tz };
}

function clockOf(text: string): Clock | null {
  const match = CLOCK.exec(text);

  if (!match) return null;

  const clock = { h: Number(match[1]), min: Number(match[2]) };

  return clock.h <= 23 && clock.min <= 59 ? clock : null;
}

function durationOf(text: string): number | null {
  if (!DURATION.test(text)) return null;

  let ms = 0;

  for (const [, n, unit] of text.matchAll(/(\d+)\s*([mhdw])/g))
    ms += Number(n) * (UNIT_MS[unit ?? ""] ?? 0);

  return ms > 0 ? ms : null;
}

/** `clock` on today + `days`; when that has passed, `step` days later (0: no retry). */
function clockOn(today: Today, days: number, clock: Clock, step: number): number {
  const on = (n: number) =>
    wallToInstant(Date.UTC(today.y, today.m - 1, today.d + n, clock.h, clock.min), today.tz);
  const first = on(days);

  return first > today.now || step === 0 ? first : on(days + step);
}

function dateOf(text: string, today: Today): number | null {
  const match = DATE.exec(text);

  if (!match) return null;

  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const clock = match[4] === undefined ? MORNING : clockOf(match[4]);
  const day = new Date(Date.UTC(y, m - 1, d));

  if (!clock || day.getUTCMonth() !== m - 1 || day.getUTCDate() !== d) return null;

  return wallToInstant(Date.UTC(y, m - 1, d, clock.h, clock.min), today.tz);
}

function withClock(text: string, at: (clock: Clock) => number): number | null {
  const clock = clockOf(text);

  return clock ? at(clock) : null;
}

/** "tomorrow 9:00", "mon 9:00" or "18:00". */
function dayClockOf(text: string, today: Today): number | null {
  const [first = "", rest, extra] = text.split(/\s+/);
  const weekday = DAYS.indexOf(first);

  if (rest === undefined) return withClock(first, (clock) => clockOn(today, 0, clock, 1));

  const clock = clockOf(rest);

  if (!clock || extra !== undefined) return null;

  if (first === "tomorrow") return clockOn(today, 1, clock, 0);

  if (weekday < 0) return null;

  return clockOn(today, (weekday - today.weekday + 7) % 7, clock, 7);
}

export function parseWhen(text: string, now: number, timeZone: string): When {
  const t = text.trim().toLowerCase();
  const today = todayIn(now, timeZone);
  const ms = durationOf(t);
  const at = ms === null ? (dateOf(t, today) ?? dayClockOf(t, today)) : now + ms;

  return at
    ? { at }
    : { error: `Couldn't read \`${text}\`. Try \`2h\`, \`18:00\`, \`tomorrow 9:00\`.` };
}
