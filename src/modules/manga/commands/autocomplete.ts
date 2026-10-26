import type { AutocompleteInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import { autocompleteChoices } from "../../../core/replies.ts";
import type { Ctx } from "../../../core/types.ts";
import { searchManga } from "../api/search.ts";
import type { MangaDexGet } from "../api/types.ts";
import { MangaRepo } from "../store/repo.ts";
import type { TitleRequest } from "./types.ts";

type Choice = { name: string; value: string };

/** Discord drops an autocomplete answer after 3 s. */
const DEADLINE_MS = 2500;

async function search(get: MangaDexGet, typed: string): Promise<Choice[]> {
  try {
    const hits = await searchManga(get, typed);

    return autocompleteChoices(
      hits.map((h) => ({ name: h.title, value: h.id })),
      "",
    );
  } catch (err) {
    log.error("manga:search", "search failed", err);

    return [];
  }
}

/** MangaDex's hits as typed; nothing on a blank, failed or too slow search. */
async function searchChoices(get: MangaDexGet, typed: string, deadlineMs: number) {
  if (typed.trim() === "") return [];

  const late = new Promise<Choice[]>((resolve) => setTimeout(() => resolve([]), deadlineMs));

  return Promise.race([search(get, typed.trim()), late]);
}

/** follow searches MangaDex; unfollow offers the member's own follows. */
export async function titleChoices(
  repo: MangaRepo,
  get: MangaDexGet,
  req: TitleRequest,
  deadlineMs = DEADLINE_MS,
): Promise<Choice[]> {
  if (req.sub === "follow") return searchChoices(get, req.typed, deadlineMs);

  const follows = repo.follows.byUser(req.userId).map((s) => ({ name: s.title, value: s.id }));

  return autocompleteChoices(follows, req.typed);
}

export function mangaAutocomplete(get: MangaDexGet) {
  return async (i: AutocompleteInteraction, ctx: Ctx): Promise<void> => {
    const req = {
      sub: i.options.getSubcommand(),
      typed: i.options.getFocused(),
      userId: i.user.id,
    };
    await i.respond(await titleChoices(new MangaRepo(ctx.db), get, req));
  };
}
