import { dueMessage, lostMessage } from "./render.ts";
import type { DueDeps, Reminder } from "./types.ts";

/** Sent reminders are kept this long, so their buttons still work. */
const KEEP_MS = 7 * 24 * 3_600_000;

/** Sends one reminder; a lost channel sends it to the author instead, and it counts as sent. */
async function deliver(r: Reminder, now: number, d: DueDeps): Promise<void> {
  const sent = await d.send(r.channelId, dueMessage(r, now));

  if (sent.result === "ok") {
    d.store.markSent(r.id, now, sent.messageId);

    return;
  }

  if (sent.result === "failed") return;

  await d.dm(r.authorId, lostMessage(r, d.guildName(r.guildId)));
  d.store.markSent(r.id, now, null);
}

/** Sends every due reminder, oldest first, then drops old sent ones. */
export async function runDue(d: DueDeps): Promise<void> {
  const now = d.now();

  for (const r of d.store.due(now)) await deliver(r, now, d);

  d.store.prune(now - KEEP_MS);
}
