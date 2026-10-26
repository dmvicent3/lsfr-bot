import type { FetchFn } from "../../../core/types.ts";

/** Query params; an array repeats its key (`ids[]=a&ids[]=b`). */
export type Query = Record<string, string | string[]>;

/** A GET against the MangaDex API, returning the parsed JSON body. */
export type MangaDexGet = (path: string, query: Query) => Promise<unknown>;

export interface ClientOptions {
  fetchFn: FetchFn;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  /** Base delay between attempts; tests pass 0. */
  retryDelayMs?: number;
}

export interface MangaInfo {
  id: string;
  title: string;
  /** The newest chapter upload in any language; it changing means the feed may have news. */
  latestUpload: string | null;
  coverFile: string | null;
  author: string | null;
}

export interface Chapter {
  id: string;
  mangaId: string;
  /** As MangaDex gives it ("42", "10.5"); null for oneshots. */
  number: string | null;
  title: string | null;
  group: string | null;
  /** Official releases (MangaPlus and the like) link out instead of reading on MangaDex. */
  externalUrl: string | null;
  readableAt: string;
}

export interface SearchHit {
  id: string;
  title: string;
}
