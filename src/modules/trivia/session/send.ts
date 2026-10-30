import type { Deps, Outgoing, SessionState } from "./types.ts";

/** Posts to the session's channel; any failed send marks the session lost. */
export async function send(s: SessionState, d: Deps, msg: Outgoing): Promise<string | null> {
  if (s.lost) return null;

  const sent = await d.poster.post(msg);

  if (sent.result === "ok") return sent.messageId;

  s.lost = true;

  return null;
}

/** Edits a message; a failed edit is not worth ending the session over. */
export async function edit(d: Deps, messageId: string | null, msg: Outgoing): Promise<void> {
  if (messageId) await d.poster.edit(messageId, msg);
}
