import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import type { ComponentHandler, Ctx } from "../../core/types.ts";
import { reply } from "./commands/kit.ts";
import { listMessage, snoozedNote } from "./render.ts";
import { canAct } from "./rules.ts";
import { ReminderStore } from "./store/reminders.ts";
import type { Clicker, Reminder } from "./types.ts";

const SNOOZE_MINUTES = new Set([10, 60]);

function clickerOf(i: MessageComponentInteraction): Clicker {
  const roles = i.member?.roles;
  const roleIds = Array.isArray(roles) ? roles : (roles?.cache.map((r) => r.id) ?? []);

  return { id: i.user.id, roleIds };
}

/** The reminder behind a ping's button, when the clicker may use it; otherwise answers them. */
async function actable(
  i: MessageComponentInteraction,
  store: ReminderStore,
  id: number,
): Promise<Reminder | null> {
  const r = store.get(id);

  if (!r) {
    await i.update({ components: [] });
    await i.followUp({ content: "This reminder is gone.", flags: MessageFlags.Ephemeral });

    return null;
  }

  if (canAct(r, clickerOf(i))) return r;

  await reply(i, "This isn't your reminder.");

  return null;
}

const snooze: ComponentHandler = {
  id: "reminders:snooze",
  async handle(i, args, ctx: Ctx) {
    const minutes = Number(args[1]);
    const store = new ReminderStore(ctx.db);
    const r = SNOOZE_MINUTES.has(minutes) ? await actable(i, store, Number(args[0])) : null;

    if (!r) return;

    const dueAt = Date.now() + minutes * 60_000;
    store.snooze(r.id, dueAt);
    await i.update({ content: `${i.message.content}\n${snoozedNote(dueAt)}`, components: [] });
  },
};

const done: ComponentHandler = {
  id: "reminders:done",
  async handle(i, args, ctx) {
    const store = new ReminderStore(ctx.db);
    const r = await actable(i, store, Number(args[0]));

    if (!r) return;

    store.remove(r.id);
    await i.update({ components: [] });
  },
};

/** /remind list's buttons: only the author sees the list, but check anyway. */
const cancel: ComponentHandler = {
  id: "reminders:cancel",
  async handle(i, args, ctx) {
    const store = new ReminderStore(ctx.db);
    const r = store.get(Number(args[0]));

    if (!i.guildId) return;

    if (r?.authorId === i.user.id && r.sentAt === null) store.remove(r.id);

    await i.update(listMessage(store.pendingByAuthor(i.guildId, i.user.id)));
  },
};

export const remindersComponents: ComponentHandler[] = [snooze, done, cancel];
