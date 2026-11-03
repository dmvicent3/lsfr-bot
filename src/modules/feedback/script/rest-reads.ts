import { Routes } from "discord.js";
import { asText, isRecord, records } from "../../../core/guards.ts";
import type { StoredPoll } from "../types.ts";
import { userName } from "./poll-state.ts";
import type { Rest } from "./types.ts";

/** Discord's largest voters page. */
const PAGE = 100;

/** Display names for user ids; an id Discord won't resolve stays an id. */
export async function userNames(rest: Rest, ids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();

  for (const id of new Set(ids)) {
    const user = await rest.get(Routes.user(id)).catch(() => null);
    names.set(id, userName(user, id));
  }

  return names;
}

/** Everyone who picked one answer, page by page. */
export async function voters(rest: Rest, poll: StoredPoll, answerId: number): Promise<string[]> {
  const names: string[] = [];
  let after = "";

  for (;;) {
    const query = new URLSearchParams({ limit: String(PAGE) });

    if (after) query.set("after", after);

    const page = await rest.get(Routes.pollAnswerVoters(poll.channelId, poll.messageId, answerId), {
      query,
    });
    const users = records(isRecord(page) ? page.users : undefined);
    names.push(...users.map((u) => userName(u, asText(u.id))));
    after = asText(users.at(-1)?.id);

    if (users.length < PAGE || !after) return names;
  }
}
