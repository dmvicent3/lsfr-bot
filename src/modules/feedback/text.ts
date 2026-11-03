import type { Access, Entry } from "./types.ts";

export const OUTSIDE = "Feedback works in a server.";

/** The public post: heading with the author's mention (never pinged), the text, an edit mark. */
export function postText(e: Pick<Entry, "topic" | "userId" | "text" | "editedAt">): string {
  const lines = [`💬 **Feedback · ${e.topic}** from <@${e.userId}>`, e.text];

  if (e.editedAt !== null) lines.push("*(edited)*");

  return lines.join("\n");
}

/** Whether `userId` may change the entry. */
export function access(entry: Entry | null, userId: string): Access {
  if (!entry || entry.removedAt !== null) return "gone";

  return entry.userId === userId ? "ok" : "not-author";
}

/** What a member is told when they may not change it. */
export const REFUSALS: Record<Exclude<Access, "ok">, string> = {
  gone: "This feedback was removed.",
  "not-author": "Only the author can change this.",
};
