import { asText, isRecord, records } from "../guards.ts";
import type { PollState } from "./types.ts";

/** The poll on a fetched message, or null when it has none. */
export function pollState(message: unknown): PollState | null {
  if (!isRecord(message) || !isRecord(message.poll)) return null;

  const results = isRecord(message.poll.results) ? message.poll.results : {};
  const counts = new Map(
    records(results.answer_counts).map((c) => [Number(c.id), Number(c.count)] as const),
  );
  const answers = records(message.poll.answers).map((a) => {
    const id = Number(a.answer_id);
    const text = isRecord(a.poll_media) ? asText(a.poll_media.text) : "";

    return { id, text, count: counts.get(id) ?? null };
  });

  return { finalized: results.is_finalized === true, answers };
}
