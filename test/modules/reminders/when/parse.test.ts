import { describe, expect, test } from "bun:test";
import { parseWhen, TIME_ZONE } from "../../../../src/modules/reminders/when/parse.ts";

/** Wednesday 2026-07-15, 11:00 in Lisbon (UTC+1). */
const NOW = Date.parse("2026-07-15T10:00:00Z");
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const at = (text: string, now = NOW) => parseWhen(text, now, TIME_ZONE);
const utc = (iso: string) => ({ at: Date.parse(iso) });

describe("parseWhen durations", () => {
  test("single and combined units", () => {
    expect(at("30m")).toEqual({ at: NOW + 30 * MIN });
    expect(at("2h")).toEqual({ at: NOW + 2 * HOUR });
    expect(at("1d 3h")).toEqual({ at: NOW + DAY + 3 * HOUR });
    expect(at("1h30m")).toEqual({ at: NOW + HOUR + 30 * MIN });
    expect(at("1w")).toEqual({ at: NOW + 7 * DAY });
  });

  test("ignores case and surrounding spaces", () => {
    expect(at(" 2H ")).toEqual(at("2h"));
  });
});

describe("parseWhen clock times", () => {
  test("later today, or tomorrow once past", () => {
    expect(at("18:00")).toEqual(utc("2026-07-15T17:00:00Z"));
    expect(at("9:00")).toEqual(utc("2026-07-16T08:00:00Z"));
    expect(at("9h00")).toEqual(at("9:00"));
    expect(at("18h30")).toEqual(utc("2026-07-15T17:30:00Z"));
  });

  test("a bare hour count is a duration, not a clock time", () => {
    expect(at("9h")).toEqual({ at: NOW + 9 * HOUR });
  });

  test("tomorrow and weekdays", () => {
    expect(at("tomorrow 9:00")).toEqual(utc("2026-07-16T08:00:00Z"));
    expect(at("wed 12:00")).toEqual(utc("2026-07-15T11:00:00Z"));
    expect(at("wed 9:00")).toEqual(utc("2026-07-22T08:00:00Z"));
    expect(at("mon 9:00")).toEqual(utc("2026-07-20T08:00:00Z"));
  });

  test("dates, in winter time", () => {
    expect(at("2026-11-02 14:30")).toEqual(utc("2026-11-02T14:30:00Z"));
    expect(at("2026-11-02")).toEqual(utc("2026-11-02T09:00:00Z"));
  });

  test("DST switch days give a defined instant", () => {
    expect(at("2026-03-29 01:30")).toEqual(utc("2026-03-29T01:30:00Z"));
    expect(at("2026-10-25 01:30")).toEqual(utc("2026-10-25T01:30:00Z"));
  });
});

describe("parseWhen errors", () => {
  test.each(["nxt fri", "", "0m", "25:00", "2026-02-30", "12:61"])("%p", (text) => {
    expect(at(text)).toEqual({
      error: `Couldn't read \`${text}\`. Try \`2h\`, \`18:00\`, \`tomorrow 9:00\`.`,
    });
  });
});
