import type { SendResult } from "../../../../src/core/types.ts";
import type { MangaDexGet } from "../../../../src/modules/manga/api/types.ts";
import type { PollDeps, PostMessage } from "../../../../src/modules/manga/poll/types.ts";
import type { MangaRepo } from "../../../../src/modules/manga/store/repo.ts";

/** A raw MangaDex chapter record. */
export const chapterRecord = (id: string, mangaId: string, chapter: string | null) => ({
  id,
  attributes: { chapter, title: null, externalUrl: null, readableAt: "2026-10-26T10:00:00+00:00" },
  relationships: [{ id: mangaId, type: "manga" }],
});

/** A raw MangaDex manga record. */
export const mangaRecord = (id: string, latestUploadedChapter: string) => ({
  id,
  attributes: { title: { en: `Title ${id}` }, altTitles: [], latestUploadedChapter },
  relationships: [],
});

function answer(items: unknown[] | Error | undefined) {
  if (items instanceof Error) throw items;

  return { data: items ?? [], total: items?.length ?? 0 };
}

/** A MangaDex stand-in: `details` answers /manga, `feeds[id]` each feed (an Error throws). */
export function fakeMangaDex(world: {
  details: unknown[] | Error;
  feeds: Record<string, unknown[] | Error>;
}): { get: MangaDexGet; paths: string[] } {
  const paths: string[] = [];

  const get: MangaDexGet = async (path) => {
    paths.push(path);

    return answer(path === "/manga" ? world.details : world.feeds[path.split("/")[2] ?? ""]);
  };

  return { get, paths };
}

/** Deps recording sends; `results` answers them in order (then ok). */
export function pollDeps(repo: MangaRepo, get: MangaDexGet, results: SendResult[] = []) {
  const sent: PostMessage[] = [];
  const deps: PollDeps = {
    repo,
    get,
    send: async (m) => {
      sent.push(m);

      return results.shift() ?? { result: "ok", messageId: "msg" };
    },
    now: () => Date.UTC(2026, 9, 26, 12),
  };

  return { deps, sent };
}
