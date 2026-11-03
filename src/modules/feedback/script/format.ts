import type { Entry, StoredPoll } from "../types.ts";
import type { PollState, Tally } from "./types.ts";

const iso = (ms: number): string => new Date(ms).toISOString();

/** `#id [topic] name created (edited, removed)` and the text, indented. */
export function entryText(e: Entry, name: string): string {
  const marks = [e.editedAt !== null ? "edited" : "", e.removedAt !== null ? "removed" : ""];
  const said = marks.filter(Boolean).join(", ");
  const head = `#${e.id} [${e.topic}] ${name} ${iso(e.createdAt)}${said ? ` (${said})` : ""}`;
  const body = e.text
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  return `${head}\n${body}`;
}

/** The entries, oldest first; `names` maps user ids to display names. */
export function entriesText(entries: Entry[], names: ReadonlyMap<string, string>): string {
  if (entries.length === 0) return "No feedback to show.";

  return entries.map((e) => entryText(e, names.get(e.userId) ?? e.userId)).join("\n\n");
}

/** One line per poll: id, question, end and whether it is still open at `now`. */
export function pollsText(polls: StoredPoll[], now: number): string {
  if (polls.length === 0) return "No polls.";

  return polls
    .map(
      (p) =>
        `#${p.id} ${p.question} · ends ${iso(p.endsAt)} · ${p.endsAt > now ? "open" : "closed"}`,
    )
    .join("\n");
}

/** The poll's question, whether Discord finalised it, then each answer's votes and voters. */
export function resultsText(
  p: StoredPoll,
  state: Pick<PollState, "finalized">,
  tallies: Tally[],
): string {
  const status = state.finalized ? "finalised" : `not finalised (ends ${iso(p.endsAt)})`;
  const lines = tallies.map((t, n) => {
    const votes = `${t.count} vote${t.count === 1 ? "" : "s"}`;

    return `${n + 1}. ${t.text}: ${votes}${t.voters.length > 0 ? ` (${t.voters.join(", ")})` : ""}`;
  });

  return [`poll #${p.id}: ${p.question}`, status, ...lines].join("\n");
}
