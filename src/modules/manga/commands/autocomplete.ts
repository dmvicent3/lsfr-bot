import type { AutocompleteInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import { autocompleteChoices } from "../../../core/replies.ts";
import type { Ctx } from "../../../core/types.ts";
import { searchManga } from "../api/search.ts";
import type { MangaDexGet } from "../api/types.ts";
import { MangaRepo } from "../store/repo.ts";
import type { TitleRequest } from "./types.ts";

type Choice = { name: string; value: string };

/** MangaDex's hits as typed; nothing on a blank or failed search (Discord waits only 3 s). */
async function searchChoices(get: MangaDexGet, typed: string): Promise<Choice[]> {
  if (typed.trim() === "") return [];

  try {
    const hits = await searchManga(get, typed.trim());

    return autocompleteChoices(
      hits.map((h) => ({ name: h.title, value: h.id })),
      "",
    );
  } catch (err) {
    log.error("manga:search", "search failed", err);

    return [];
  }
}

/** follow searches MangaDex; unfollow offers the member's own follows. */
export async function titleChoices(
  repo: MangaRepo,
  get: MangaDexGet,
  req: TitleRequest,
): Promise<Choice[]> {
  if (req.sub === "follow") return searchChoices(get, req.typed);

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
