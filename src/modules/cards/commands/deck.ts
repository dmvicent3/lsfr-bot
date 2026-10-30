import { PermissionFlagsBits } from "discord.js";
import { reply } from "../../../core/replies.ts";
import { renderList } from "../render/boards.ts";
import { addCard } from "./add-card.ts";
import type { CommandCtx } from "./types.ts";

export async function add({ i, guildId, repo }: CommandCtx): Promise<void> {
  const kind = i.options.getString("kind", true) === "prompt" ? "prompt" : "answer";
  const text = i.options.getString("text", true);

  await reply(i, addCard(repo, { guildId, kind, text, userId: i.user.id, now: Date.now() }));
}

const REMOVED = {
  removed: "Card removed.",
  "not-found": "No card with that number here.",
  "not-yours": "You can only remove cards you added.",
} as const;

export async function remove({ i, guildId, repo }: CommandCtx): Promise<void> {
  const manager = i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
  const id = i.options.getInteger("id", true);

  await reply(i, REMOVED[repo.custom.remove({ guildId, id, userId: i.user.id, manager })]);
}

export async function list({ i, guildId, repo }: CommandCtx): Promise<void> {
  const mine = i.options.getBoolean("mine") ?? false;
  const cards = repo.custom.list(guildId, mine ? i.user.id : null);

  await reply(i, renderList(cards, i.options.getInteger("page") ?? 1, mine).content);
}
