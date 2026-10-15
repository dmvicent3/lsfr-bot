import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../core/db.ts";
import { coreMigrations } from "../../core/settings.ts";
import { setReminders, toggleReminder } from "./actions.ts";
import { motorsportMigrations, MotorsportRepo } from "./repo.ts";
import type { Session } from "./types.ts";

const T = Date.parse("2026-03-14T07:00:00Z");
let repo: MotorsportRepo;

function session(sessionId: string, title: string, pingable: boolean, start: number): Session {
  return {
    series: "f1",
    eventId: "chinese-grand-prix",
    eventName: "Chinese Grand Prix",
    sessionId,
    title,
    start: new Date(start),
    end: new Date(start + 3_600_000),
    pingable,
  };
}

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
  repo.replaceSessions(
    "f1",
    [
      session("practice-1", "Practice 1", false, T + 3_600_000),
      session("qualifying", "Qualifying", true, T + 7_200_000),
      session("sprint-race", "Sprint Race", true, T - 3_600_000),
    ],
    T,
  );
});

function follow(): void {
  repo.insertFollowed({
    series: "f1",
    channelId: "c",
    roleId: "r",
    pinnedMessageId: "m",
    pinnedEventId: null,
    channelName: null,
    renamedAt: null,
  });
}

describe("toggleReminder", () => {
  test("requires the series to be followed", () => {
    expect(toggleReminder(repo, "u", "f1", "chinese-grand-prix", "qualifying", T)).toBe(
      "F1 isn't followed. Use /motorsport follow first.",
    );
  });

  test("sets then removes a reminder", () => {
    follow();
    expect(toggleReminder(repo, "u", "f1", "chinese-grand-prix", "qualifying", T)).toBe(
      "Reminder set for Chinese Grand Prix Qualifying.",
    );
    expect(repo.oneOffUsers("f1", "chinese-grand-prix", "qualifying")).toEqual(["u"]);
    expect(toggleReminder(repo, "u", "f1", "chinese-grand-prix", "qualifying", T)).toBe(
      "Reminder removed for Chinese Grand Prix Qualifying.",
    );
  });

  test("rejects practice, past sessions and other events", () => {
    follow();
    const rejected = "That session isn't in the next F1 event.";
    expect(toggleReminder(repo, "u", "f1", "chinese-grand-prix", "practice-1", T)).toBe(rejected);
    expect(toggleReminder(repo, "u", "f1", "chinese-grand-prix", "sprint-race", T)).toBe(rejected);
    expect(toggleReminder(repo, "u", "f1", "other", "qualifying", T)).toBe(rejected);
  });
});

describe("setReminders", () => {
  test("keeps only upcoming pinged sessions and describes the result", () => {
    follow();
    const text = setReminders(
      repo,
      "u",
      "f1",
      "chinese-grand-prix",
      ["qualifying", "practice-1", "sprint-race"],
      T,
    );
    expect(text).toBe("Reminders for Chinese Grand Prix: Qualifying.");
    expect(repo.userOneOffs("u", "f1", "chinese-grand-prix")).toEqual(["qualifying"]);
  });

  test("an empty selection clears them", () => {
    follow();
    setReminders(repo, "u", "f1", "chinese-grand-prix", ["qualifying"], T);
    expect(setReminders(repo, "u", "f1", "chinese-grand-prix", [], T)).toBe(
      "No reminders for Chinese Grand Prix.",
    );
    expect(repo.userOneOffs("u", "f1", "chinese-grand-prix")).toEqual([]);
  });
});
