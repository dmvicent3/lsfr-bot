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
