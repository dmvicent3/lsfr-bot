import { beforeEach, describe, expect, test } from "bun:test";
import type { MangaInfo } from "../../../../src/modules/manga/api/types.ts";
import { checkSeries } from "../../../../src/modules/manga/poll/check-series.ts";
import type { MangaRepo } from "../../../../src/modules/manga/store/repo.ts";
import { freshRepo, series } from "../store/fixtures.ts";
import { chapterRecord, fakeMangaDex, pollDeps } from "./fakes.ts";

const START = 5000;
const manga: MangaInfo = {
  id: "m1",
  title: "New",
  latestUpload: "c42",
  coverFile: null,
  author: null,
};

let repo: MangaRepo;

beforeEach(() => {
  repo = freshRepo();
  repo.series.add(series({ highest: 41 }));
  repo.follows.add("m1", "u1");
});

describe("checkSeries", () => {
  test("posts a new chapter, then stores highest and the check", async () => {
    const { get } = fakeMangaDex({
      details: [],
      feeds: { m1: [chapterRecord("c42", "m1", "42")] },
    });
    const { deps, sent } = pollDeps(repo, get);
    expect(await checkSeries(deps, repo.series.get("m1") ?? series(), manga, START)).toBe("ok");
    expect(sent.map((m) => m.content)).toEqual(["<@u1>"]);
    expect(repo.series.get("m1")).toMatchObject({
      highest: 42,
      latestUpload: "c42",
      checkedAt: START,
      title: "New",
    });
  });

  test("the same chapter again is not posted", async () => {
    const { get } = fakeMangaDex({
      details: [],
      feeds: { m1: [chapterRecord("c41", "m1", "41")] },
    });
    const { deps, sent } = pollDeps(repo, get);
    await checkSeries(deps, repo.series.get("m1") ?? series(), manga, START);
    expect(sent).toHaveLength(0);
  });

  test("a failed send keeps state; one after a sent post keeps that post's", async () => {
    const feeds = { m1: [chapterRecord("c42", "m1", "42"), chapterRecord("c43", "m1", "43")] };
    const { get } = fakeMangaDex({ details: [], feeds });
    const { deps } = pollDeps(repo, get, [{ result: "ok", messageId: "x" }, { result: "failed" }]);
    expect(await checkSeries(deps, repo.series.get("m1") ?? series(), manga, START)).toBe(
      "send-failed",
    );
    expect(repo.series.get("m1")).toMatchObject({ highest: 42, checkedAt: 1000 });
  });

  test("a oneshot is remembered once sent", async () => {
    const { get } = fakeMangaDex({ details: [], feeds: { m1: [chapterRecord("o1", "m1", null)] } });
    const { deps } = pollDeps(repo, get);
    await checkSeries(deps, repo.series.get("m1") ?? series(), manga, START);
    expect(repo.unnumbered.ids()).toEqual(new Set(["o1"]));
    expect(repo.series.get("m1")?.highest).toBe(41);
  });

  test("a feed that fails is fetch-failed and changes nothing", async () => {
    const { get } = fakeMangaDex({ details: [], feeds: { m1: new Error("down") } });
    const { deps } = pollDeps(repo, get);
    expect(await checkSeries(deps, repo.series.get("m1") ?? series(), manga, START)).toBe(
      "fetch-failed",
    );
    expect(repo.series.get("m1")).toEqual(series({ highest: 41 }));
  });
});
