import { expect, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { zoneSettingsHandler } from "../../src/core/zone-command.ts";

function fake(perms: boolean, tz = " Europe/Paris ") {
  const replies: { content?: string }[] = [];
  const i = {
    memberPermissions: { has: () => perms },
    options: { getString: () => tz },
    reply: async (r: { content?: string }) => void replies.push(r),
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handler makes
  return { i: i as unknown as ChatInputCommandInteraction, replies };
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the db is only passed through
const db = {} as never;

function saver(saved: string[]) {
  return (_db: unknown, _guildId: string, tz: string): null => {
    saved.push(tz);

    return null;
  };
}

test("refuses without Manage Server, naming the module", async () => {
  const saved: string[] = [];
  const handler = zoneSettingsHandler("chess", saver(saved));
  const { i, replies } = fake(false);
  await handler({ i, guildId: "g", db });
  expect(replies[0]?.content).toBe(
    "Only members with Manage Server can change the chess settings.",
  );
  expect(saved).toEqual([]);
});

test("saves the trimmed zone and confirms", async () => {
  const saved: string[] = [];
  const handler = zoneSettingsHandler("chess", saver(saved));
  const { i, replies } = fake(true);
  await handler({ i, guildId: "g", db });
  expect(saved).toEqual(["Europe/Paris"]);
  expect(replies[0]?.content).toBe("Time zone set to Europe/Paris. Applies from the next puzzle.");
});

test("relays what the save found wrong", async () => {
  const handler = zoneSettingsHandler("chess", () => "Unknown time zone: x.");
  const { i, replies } = fake(true, "x");
  await handler({ i, guildId: "g", db });
  expect(replies[0]?.content).toBe("Unknown time zone: x.");
});
