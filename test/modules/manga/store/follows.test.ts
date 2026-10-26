import { beforeEach, describe, expect, test } from "bun:test";
import type { MangaRepo } from "../../../../src/modules/manga/store/repo.ts";
import { freshRepo, series } from "./fixtures.ts";

let repo: MangaRepo;

beforeEach(() => {
  repo = freshRepo();
  repo.series.add(series({ id: "m1", title: "Zom 100" }));
  repo.series.add(series({ id: "m2", title: "Akane" }));
});

describe("FollowStore", () => {
  test("add is false the second time; remove is false when not following", () => {
    expect(repo.follows.add("m1", "u1")).toBe(true);
    expect(repo.follows.add("m1", "u1")).toBe(false);
    expect(repo.follows.remove("m1", "u1")).toBe(true);
    expect(repo.follows.remove("m1", "u1")).toBe(false);
  });

  test("followers, count and byUser", () => {
    repo.follows.add("m1", "u1");
    repo.follows.add("m2", "u1");
    repo.follows.add("m1", "u2");
    expect(repo.follows.followers("m1")).toEqual(["u1", "u2"]);
    expect(repo.follows.count("u1")).toBe(2);
    expect(repo.follows.count("u3")).toBe(0);
    expect(repo.follows.byUser("u1").map((s) => s.title)).toEqual(["Akane", "Zom 100"]);
  });
});
