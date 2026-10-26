import type { Reminder } from "../../../src/modules/reminders/types.ts";

/** A reminder set by u1 for u2 in g1/c1, due at 0. */
export function reminder(over: Partial<Reminder> = {}): Reminder {
  return {
    id: 7,
    guildId: "g1",
    channelId: "c1",
    authorId: "u1",
    target: { kind: "user", id: "u2" },
    text: "water the plants",
    dueAt: 0,
    createdAt: 0,
    sentAt: null,
    messageId: null,
    ...over,
  };
}
