import { dueMessage, lostMessage } from "./render.ts";
import type { DueDeps, Reminder } from "./types.ts";

/** Sent reminders are kept this long, so their buttons still work. */
const KEEP_MS = 7 * 24 * 3_600_000;
/** A channel still refusing the ping this long after due (e.g. no send permission) is given up on. */
const GIVE_UP_MS = 24 * 3_600_000;

async function toAuthor(r: Reminder, now: number, d: DueDeps): Promise<void> {
  await d.dm(r.authorId, lostMessage(r, d.guildName(r.guildId)));
  d.store.markSent(r.id, now, null);
}

const targetGone = (r: Reminder, d: DueDeps): boolean =>
  r.target.kind === "role" && !d.roleExists(r.guildId, r.target.id);

/**
 * Sends one reminder. A lost channel, a deleted target role, or a channel failing for a day
 * sends it to the author instead, and it counts as sent.
 */
async function deliver(r: Reminder, now: number, d: DueDeps): Promise<void> {
  if (targetGone(r, d)) return toAuthor(r, now, d);

  const sent = await d.send(r.channelId, dueMessage(r, now));

  if (sent.result === "ok") {
    d.store.markSent(r.id, now, sent.messageId);

    return;
  }

  if (sent.result === "failed" && now - r.dueAt <= GIVE_UP_MS) return;

  await toAuthor(r, now, d);
}

/** Sends every due reminder, oldest first, then drops old sent ones. */
export async function runDue(d: DueDeps): Promise<void> {
  const now = d.now();

  for (const r of d.store.due(now)) await deliver(r, now, d);

  d.store.prune(now - KEEP_MS);
}
