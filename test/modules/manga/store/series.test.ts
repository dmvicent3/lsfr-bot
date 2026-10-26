import { beforeEach, describe, expect, test } from "bun:test";
import type { MangaRepo } from "../../../../src/modules/manga/store/repo.ts";
import { freshRepo, series } from "./fixtures.ts";

let repo: MangaRepo;

beforeEach(() => {
  repo = freshRepo();
});

describe("SeriesStore", () => {
  test("adding twice keeps the first row", () => {
    expect(repo.series.add(series())).toBe(true);
    expect(repo.series.add(series({ title: "Other", highest: 99 }))).toBe(false);
    expect(repo.series.get("m1")).toEqual(series());
  });

  test("get of an unknown id is null", () => {
    expect(repo.series.get("nope")).toBeNull();
  });

  test("followed lists only series someone follows, by title", () => {
    repo.series.add(series({ id: "m1", title: "Zom 100" }));
    repo.series.add(series({ id: "m2", title: "Akane" }));
    repo.series.add(series({ id: "m3", title: "Nobody" }));
    repo.follows.add("m1", "u1");
    repo.follows.add("m2", "u1");
    repo.follows.add("m2", "u2");
    expect(repo.series.followed().map((s) => s.id)).toEqual(["m2", "m1"]);
    repo.follows.remove("m1", "u1");
    expect(repo.series.followed().map((s) => s.id)).toEqual(["m2"]);
  });

  test("setHighest keeps decimals; markChecked stores title, upload and time", () => {
    repo.series.add(series({ highest: null, latestUpload: null }));
    repo.series.setHighest("m1", 10.5);
    repo.series.markChecked("m1", { title: "Frieren 2", latestUpload: "c11", checkedAt: 2000 });
    expect(repo.series.get("m1")).toEqual(
      series({ title: "Frieren 2", highest: 10.5, latestUpload: "c11", checkedAt: 2000 }),
    );
  });
});
