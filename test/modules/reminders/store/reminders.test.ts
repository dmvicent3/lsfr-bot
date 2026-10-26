import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { remindersMigrations } from "../../../../src/modules/reminders/store/migrations.ts";
import { ReminderStore } from "../../../../src/modules/reminders/store/reminders.ts";
import type { NewReminder } from "../../../../src/modules/reminders/types.ts";

let store: ReminderStore;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, remindersMigrations);
  store = new ReminderStore(db);
});

function add(over: Partial<NewReminder> = {}) {
  return store.add({
    guildId: "g1",
    channelId: "c1",
    authorId: "u1",
    target: { kind: "user", id: "u1" },
    text: "stretch",
    dueAt: 100,
    createdAt: 1,
    ...over,
  });
}

describe("ReminderStore", () => {
  test("add and get round trip, for user and role targets", () => {
    const mine = add();
    const theirs = add({ target: { kind: "role", id: "r1" } });

    expect(store.get(mine.id)).toEqual({ ...mine, sentAt: null, messageId: null });
    expect(store.get(theirs.id)?.target).toEqual({ kind: "role", id: "r1" });
    expect(store.get(999)).toBeNull();
  });

  test("due: unsent and due by now, oldest first", () => {
    const late = add({ dueAt: 50 });
    const onTime = add({ dueAt: 100 });
    add({ dueAt: 101 });

    expect(store.due(100).map((r) => r.id)).toEqual([late.id, onTime.id]);
  });

  test("markSent hides it from due; snooze brings it back at the new time", () => {
    const r = add();
    store.markSent(r.id, 120, "m1");

    expect(store.due(1_000)).toEqual([]);
    expect(store.get(r.id)).toMatchObject({ sentAt: 120, messageId: "m1" });

    store.snooze(r.id, 700);

    expect(store.due(699)).toEqual([]);
    expect(store.due(700)).toEqual([{ ...r, dueAt: 700, sentAt: null, messageId: null }]);
  });

  test("pendingByAuthor: this author's unsent ones in this server, due order", () => {
    const later = add({ dueAt: 300 });
    const sooner = add({ dueAt: 200 });
    store.markSent(add().id, 120, null);
    add({ authorId: "u2" });
    add({ guildId: "g2" });

    expect(store.pendingByAuthor("g1", "u1").map((r) => r.id)).toEqual([sooner.id, later.id]);
  });

  test("remove is true once", () => {
    const r = add();

    expect(store.remove(r.id)).toBe(true);
    expect(store.remove(r.id)).toBe(false);
  });

  test("prune deletes only rows sent before the cutoff", () => {
    const old = add();
    const recent = add();
    const pending = add();
    store.markSent(old.id, 10, null);
    store.markSent(recent.id, 30, null);

    expect(store.prune(20)).toBe(1);
    expect(store.get(old.id)).toBeNull();
    expect(store.get(recent.id)).not.toBeNull();
    expect(store.get(pending.id)).not.toBeNull();
  });
});
