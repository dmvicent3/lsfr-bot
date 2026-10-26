import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import type { MessageCreateOptions } from "discord.js";
import { runMigrations } from "../../../src/core/db.ts";
import type { SendResult } from "../../../src/core/types.ts";
import { runDue } from "../../../src/modules/reminders/due.ts";
import { remindersMigrations } from "../../../src/modules/reminders/store/migrations.ts";
import { ReminderStore } from "../../../src/modules/reminders/store/reminders.ts";
import type { DueDeps } from "../../../src/modules/reminders/types.ts";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

let store: ReminderStore;
let sent: { channelId: string; m: MessageCreateOptions }[];
let dms: { userId: string; m: MessageCreateOptions }[];
let sendResult: SendResult;
let dmWorks: boolean;
let now: number;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, remindersMigrations);
  store = new ReminderStore(db);
  sent = [];
  dms = [];
  sendResult = { result: "ok", messageId: "m1" };
  dmWorks = true;
  now = 10 * DAY;
});

const deps = (): DueDeps => ({
  store,
  send: async (channelId, m) => {
    sent.push({ channelId, m });

    return sendResult;
  },
  dm: async (userId, m) => {
    dms.push({ userId, m });

    return dmWorks;
  },
  guildName: (id) => (id === "g1" ? "Pit Wall" : "?"),
  now: () => now,
});

function add(dueAt: number) {
  return store.add({
    guildId: "g1",
    channelId: "c1",
    authorId: "u1",
    target: { kind: "user", id: "u1" },
    text: "stretch",
    dueAt,
    createdAt: 0,
  });
}

describe("runDue", () => {
  test("sends a due reminder once and stores the message id", async () => {
    const r = add(now);
    await runDue(deps());
    await runDue(deps());

    expect(sent).toHaveLength(1);
    expect(sent[0]?.channelId).toBe("c1");
    expect(store.get(r.id)).toMatchObject({ sentAt: now, messageId: "m1" });
  });

  test("a reminder 3 h late says so", async () => {
    add(now - 3 * HOUR);
    await runDue(deps());

    expect(sent[0]?.m.content).toContain("(late by 3h)");
  });

  test("a lost channel DMs the author with the server and channel, and counts as sent", async () => {
    sendResult = { result: "lost-channel" };
    dmWorks = false;
    const r = add(now);
    await runDue(deps());

    expect(dms[0]?.userId).toBe("u1");
    expect(dms[0]?.m.content).toContain("Pit Wall");
    expect(dms[0]?.m.content).toContain("<#c1>");
    expect(dms[0]?.m.content).toContain("stretch");
    expect(store.get(r.id)?.sentAt).toBe(now);
  });

  test("any other failure stays due and goes out on a later run", async () => {
    sendResult = { result: "failed" };
    const r = add(now);
    await runDue(deps());

    expect(store.get(r.id)?.sentAt).toBeNull();

    sendResult = { result: "ok", messageId: "m2" };
    now += 60_000;
    await runDue(deps());

    expect(sent).toHaveLength(2);
    expect(store.get(r.id)?.messageId).toBe("m2");
  });

  test("prunes reminders sent more than 7 days ago", async () => {
    const old = add(0);
    const recent = add(0);
    store.markSent(old.id, now - 8 * DAY, null);
    store.markSent(recent.id, now - 6 * DAY, null);
    await runDue(deps());

    expect(store.get(old.id)).toBeNull();
    expect(store.get(recent.id)).not.toBeNull();
  });
});
