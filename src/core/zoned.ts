/** The wall-clock fields of instant `t` in `tz`. */
export function wallOf(t: number, tz: string): Record<string, number> {
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
export function wallToInstant(wall: number, tz: string): number {
  return wall - offsetAt(wall - offsetAt(wall, tz), tz);
}

const pad = (n: number | undefined): string => String(n ?? 0).padStart(2, "0");

/** The date of instant `t` in `tz`, as YYYY-MM-DD. */
export function dateIn(t: number, tz: string): string {
  const w = wallOf(t, tz);

  return `${w["year"]}-${pad(w["month"])}-${pad(w["day"])}`;
}

/** The instant the date in `tz` next changes. */
export function nextMidnight(t: number, tz: string): number {
  const w = wallOf(t, tz);

  return wallToInstant(Date.UTC(w["year"] ?? 0, (w["month"] ?? 1) - 1, (w["day"] ?? 1) + 1), tz);
}
