import { reply } from "../../../core/replies.ts";
import type { Series } from "../store/types.ts";
import type { CommandCtx } from "./types.ts";

const LIMIT = 2000;

const line = (s: Series): string =>
  `- [${s.title}](https://mangadex.org/title/${s.id}) · Ch.${s.highest ?? "—"}`;

/** Whole lines up to Discord's 2000 characters, then how many more there are. */
function fit(lines: string[]): string {
  const kept: string[] = [];
  let length = 0;

  for (const l of lines) {
    if (length + l.length + 1 > LIMIT - 20) break;

    kept.push(l);
    length += l.length + 1;
  }

  const more = lines.length - kept.length;

  return more > 0 ? `${kept.join("\n")}\n…and ${more} more` : kept.join("\n");
}

export async function list({ i, repo }: CommandCtx): Promise<void> {
  const follows = repo.follows.byUser(i.user.id);

  if (follows.length === 0) return reply(i, "No follows yet. Add one with `/manga follow`.");

  await reply(i, fit(follows.map(line)));
}
