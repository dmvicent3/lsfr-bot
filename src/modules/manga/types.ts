import type { MangaDexGet } from "./api/types.ts";
import type { MangaRepo } from "./store/repo.ts";

export type FollowResult =
  | { kind: "followed" | "already"; title: string }
  | { kind: "limit" | "not-found" };

export interface FollowDeps {
  repo: MangaRepo;
  get: MangaDexGet;
  now: number;
}

export interface FollowRequest {
  userId: string;
  mangaId: string;
}
