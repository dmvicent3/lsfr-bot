import { beforeEach, describe, expect, test } from "bun:test";
import type { MangaDexGet } from "../../../src/modules/manga/api/types.ts";
import { followManga } from "../../../src/modules/manga/follow.ts";
import type { MangaRepo } from "../../../src/modules/manga/store/repo.ts";
import { POLE_STAR, responses } from "./fixtures.ts";
import { freshRepo, series } from "./store/fixtures.ts";

const NOW = 7000;

let repo: MangaRepo;
let paths: string[];

/** /manga answers the details fixture filtered to the asked ids; feeds the latest fixture. */
const get: MangaDexGet = async (path, q) => {
  paths.push(path);

  if (path !== "/manga") return responses.latest;

  const ids = q["ids[]"] ?? [];

  return { ...responses.details, data: responses.details.data.filter((m) => ids.includes(m.id)) };
};

const follow = (userId: string, mangaId = POLE_STAR) =>
  followManga({ repo, get, now: NOW }, { userId, mangaId });

beforeEach(() => {
  repo = freshRepo();
  paths = [];
});

describe("followManga", () => {
  test("a new manga starts at its latest English chapter", async () => {
    expect(await follow("u1")).toEqual({ kind: "followed", title: "POLE STAR" });
    expect(repo.series.get(POLE_STAR)).toEqual({
      id: POLE_STAR,
      title: "POLE STAR",
      highest: 36,
      latestUpload: "83ee246e-347d-403c-a2ca-f02ca992ebca",
      checkedAt: NOW,
    });
    expect(repo.follows.followers(POLE_STAR)).toEqual(["u1"]);
  });

  test("a second member keeps the series as it is, without fetching", async () => {
    repo.series.add(series({ id: POLE_STAR, title: "POLE STAR", highest: 30 }));
    expect(await follow("u2")).toEqual({ kind: "followed", title: "POLE STAR" });
    expect(paths).toEqual([]);
    expect(repo.series.get(POLE_STAR)?.highest).toBe(30);
  });

  test("following twice", async () => {
    await follow("u1");
    expect(await follow("u1")).toEqual({ kind: "already", title: "POLE STAR" });
  });

  test("the 101st follow is refused before any fetch", async () => {
    for (let k = 0; k < 100; k++) {
      repo.series.add(series({ id: `s${k}` }));
      repo.follows.add(`s${k}`, "u1");
    }

    expect(await follow("u1")).toEqual({ kind: "limit" });
    expect(paths).toEqual([]);
  });

  test("an unknown manga stores nothing", async () => {
    expect(await follow("u1", "nope")).toEqual({ kind: "not-found" });
    expect(repo.series.get("nope")).toBeNull();
    expect(repo.follows.count("u1")).toBe(0);
  });
});
