import { expect, test } from "bun:test";
import {
  currentStreak,
  dailyStreak,
  streakOf,
  nextStreak,
  daysBefore,
  previousDate,
  periodRanks,
  puzzleNumber,
  rankOf,
  untilNext,
} from "../../src/core/daily.ts";

test("win after yesterday's win extends", () => {
  expect(nextStreak({ date: "2026-10-28", won: true, streak: 2 }, "2026-10-29", true)).toBe(3);
});

test("win after a skipped day restarts", () => {
  expect(nextStreak({ date: "2026-10-27", won: true, streak: 5 }, "2026-10-29", true)).toBe(1);
});

test("win after yesterday's loss restarts", () => {
  expect(nextStreak({ date: "2026-10-28", won: false, streak: 0 }, "2026-10-29", true)).toBe(1);
});

test("first ever win is 1", () => expect(nextStreak(null, "2026-10-29", true)).toBe(1));

test("a loss resets", () => {
  expect(nextStreak({ date: "2026-10-28", won: true, streak: 4 }, "2026-10-29", false)).toBe(0);
});

test("current streak survives until the day after", () => {
  const last = { date: "2026-10-28", won: true, streak: 4 };
  expect(currentStreak(last, "2026-10-28")).toBe(4);
  expect(currentStreak(last, "2026-10-29")).toBe(4);
  expect(currentStreak(last, "2026-10-30")).toBe(0);
  expect(currentStreak(null, "2026-10-30")).toBe(0);
});

test("puzzle numbers count from launch", () => {
  expect(puzzleNumber("2026-10-28", "2026-10-28")).toBe(1);
  expect(puzzleNumber("2026-11-01", "2026-10-28")).toBe(5);
  expect(puzzleNumber("2027-10-28", "2026-10-28")).toBe(366);
});

test("daysBefore counts back whole days across months and years", () => {
  expect(daysBefore("2026-11-05", 0)).toBe("2026-11-05");
  expect(daysBefore("2026-11-05", 30)).toBe("2026-10-06");
  expect(daysBefore("2027-03-01", 365)).toBe("2026-03-01");
});

test("previousDate crosses months and years", () => {
  expect(previousDate("2026-11-01")).toBe("2026-10-31");
  expect(previousDate("2027-01-01")).toBe("2026-12-31");
});

test("untilNext shows hours and minutes", () => {
  expect(untilNext(Date.UTC(2026, 6, 1, 17, 47, 30), "Europe/Lisbon")).toBe("5h 12m");
});

test("untilNext drops zero hours", () => {
  expect(untilNext(Date.UTC(2026, 6, 1, 22, 48), "Europe/Lisbon")).toBe("12m");
});

test("rankOf is 1-based, null when absent", () => {
  const list = [{ userId: "a" }, { userId: "b" }];
  expect(rankOf(list, "b")).toBe(2);
  expect(rankOf(list, "z")).toBeNull();
});

test("periodRanks asks for each period in turn", () => {
  expect(periodRanks((p) => (p === "week" ? 2 : null))).toEqual({
    today: null,
    week: 2,
    month: null,
    all: null,
  });
});

test("dailyStreak extends yesterday's streak and otherwise starts at 1", () => {
  expect(dailyStreak({ date: "2026-11-04", streak: 3 }, "2026-11-05")).toBe(4);
  expect(dailyStreak({ date: "2026-11-02", streak: 3 }, "2026-11-05")).toBe(1);
  expect(dailyStreak({ date: "2026-11-04", streak: null }, "2026-11-05")).toBe(1);
  expect(dailyStreak(null, "2026-11-05")).toBe(1);
});

test("streakOf asks the store for the last finished game before the date", () => {
  const seen: string[] = [];
  const games = {
    lastFinishedBefore: (guildId: string, userId: string, date: string) => {
      seen.push(`${guildId}/${userId}/${date}`);

      return { date: "2026-11-04", streak: 3 };
    },
  };

  expect(streakOf(games, { guildId: "g", userId: "u", date: "2026-11-05" })).toBe(4);
  expect(seen).toEqual(["g/u/2026-11-05"]);
});
