import { describe, expect, test } from "bun:test";
import { ApplicationCommandOptionType, InteractionContextType } from "discord.js";
import { data } from "../../../src/modules/reminders/commands/data.ts";
import { newReminder } from "../../../src/modules/reminders/rules.ts";
import type { NewRequest } from "../../../src/modules/reminders/types.ts";

const NOW = Date.parse("2026-07-15T10:00:00Z");
const ask = (over: Partial<NewRequest> = {}) =>
  newReminder({
    guildId: "g1",
    channelId: "c1",
    authorId: "u1",
    when: "2h",
    what: " stretch ",
    who: null,
    now: NOW,
    pending: 0,
    ...over,
  });

describe("newReminder", () => {
  test("for yourself by default", () => {
    expect(ask()).toEqual({
      reminder: {
        guildId: "g1",
        channelId: "c1",
        authorId: "u1",
        target: { kind: "user", id: "u1" },
        text: "stretch",
        dueAt: NOW + 2 * 3_600_000,
        createdAt: NOW,
      },
    });
  });

  test("for a role", () => {
    expect(ask({ who: { kind: "role", id: "r1" } })).toMatchObject({
      reminder: { target: { kind: "role", id: "r1" } },
    });
  });

  test("@everyone, an unreadable time and the 26th reminder are refused", () => {
    expect(ask({ who: { kind: "role", id: "g1" } })).toHaveProperty("error");
    expect(ask({ when: "nxt fri" })).toEqual({
      error: "Couldn't read `nxt fri`. Try `2h`, `18:00`, `tomorrow 9:00`.",
    });
    expect(ask({ pending: 25 })).toHaveProperty("error");
  });
});

describe("/remind data", () => {
  test("set and list, in servers only", () => {
    const [set, list] = data.options ?? [];

    expect(data.name).toBe("remind");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(list?.name).toBe("list");
    expect(set?.name).toBe("set");

    const options = set?.type === ApplicationCommandOptionType.Subcommand ? set.options : [];

    expect(options?.map((o) => [o.name, o.type, o.required ?? false])).toEqual([
      ["when", ApplicationCommandOptionType.String, true],
      ["what", ApplicationCommandOptionType.String, true],
      ["who", ApplicationCommandOptionType.Mentionable, false],
    ]);
  });
});
