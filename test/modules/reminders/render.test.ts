import { describe, expect, test } from "bun:test";
import {
  confirmation,
  dueMessage,
  listMessage,
  snoozedNote,
} from "../../../src/modules/reminders/render.ts";
import type { ButtonRow } from "../../../src/modules/reminders/types.ts";
import { reminder } from "./fixtures.ts";

const HOUR = 3_600_000;

function ids(rows: ButtonRow[]): string[] {
  return rows.flatMap((row) => row.components.map((b) => b.custom_id));
}

describe("dueMessage", () => {
  test("pings only the target user, notes who set it and how late it is", () => {
    const m = dueMessage(reminder(), 3 * HOUR);

    expect(m.content).toBe("⏰ <@u2>: water the plants (set by <@u1>) (late by 3h)");
    expect(m.allowedMentions).toEqual({ users: ["u2"] });
    expect(ids(m.components)).toEqual([
      "reminders:snooze:7:10",
      "reminders:snooze:7:60",
      "reminders:done:7",
    ]);
  });

  test("a role target pings only the role; own reminders on time have no notes", () => {
    const m = dueMessage(reminder({ authorId: "u2", target: { kind: "role", id: "r1" } }), 0);

    expect(m.content).toBe("⏰ <@&r1>: water the plants (set by <@u2>)");
    expect(m.allowedMentions).toEqual({ roles: ["r1"] });
    expect(dueMessage(reminder({ authorId: "u2" }), 0).content).toBe("⏰ <@u2>: water the plants");
  });

  test("mentions in the text stay text", () => {
    const m = dueMessage(reminder({ text: "@everyone hi" }), 0);

    expect(m.content).toContain("@everyone hi");
    expect(m.allowedMentions).toEqual({ users: ["u2"] });
  });
});

describe("confirmation", () => {
  test("relative and full time, the text, and the target when it isn't the author", () => {
    const text = confirmation(reminder({ dueAt: 1_800_000_000_000 }));

    expect(text).toContain("<t:1800000000:R>");
    expect(text).toContain("<t:1800000000:F>");
    expect(text).toContain("water the plants");
    expect(text).toContain("for <@u2>");
    expect(confirmation(reminder({ authorId: "u2" }))).not.toContain("for ");
  });
});

describe("listMessage", () => {
  test("one line and one cancel button per reminder", () => {
    const m = listMessage([reminder({ id: 3 }), reminder({ id: 9, text: "call mum" })]);

    expect(m.content.split("\n")).toHaveLength(2);
    expect(ids(m.components)).toEqual(["reminders:cancel:3", "reminders:cancel:9"]);
    const labels = (m.components[0]?.components ?? []).map((b) => b.label);
    expect(labels).toEqual(["Cancel #1", "Cancel #2"]);
  });

  test("an empty list says so", () => {
    expect(listMessage([])).toEqual({ content: "You have no reminders.", components: [] });
  });
});

test("snoozedNote", () => {
  expect(snoozedNote(1_800_000_000_000)).toBe("💤 snoozed until <t:1800000000:t>");
});
