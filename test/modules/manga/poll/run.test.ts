import { beforeEach, describe, expect, test } from "bun:test";
import { runPoll } from "../../../../src/modules/manga/poll/run.ts";
import type { MangaRepo } from "../../../../src/modules/manga/store/repo.ts";
import { freshRepo, series } from "../store/fixtures.ts";
import { chapterRecord, fakeMangaDex, mangaRecord, pollDeps } from "./fakes.ts";

const NOW = Date.UTC(2026, 9, 26, 12);

let repo: MangaRepo;

beforeEach(() => {
  repo = freshRepo();

  for (const id of ["m1", "m2"]) {
    repo.series.add(series({ id, title: id, highest: 1, latestUpload: "old", checkedAt: NOW }));
    repo.follows.add(id, "u1");
  }
});

const both = { m1: [chapterRecord("a2", "m1", "2")], m2: [chapterRecord("b2", "m2", "2")] };
const changed = [mangaRecord("m1", "new"), mangaRecord("m2", "new")];

describe("runPoll", () => {
  test("checks only changed series", async () => {
    const { get, paths } = fakeMangaDex({
      details: [mangaRecord("m1", "new"), mangaRecord("m2", "old")],
      feeds: both,
    });
    const { deps, sent } = pollDeps(repo, get);
    await runPoll(deps);
    expect(paths).toEqual(["/manga", "/manga/m1/feed"]);
    expect(sent).toHaveLength(1);
  });

  test("a failed feed skips that series only", async () => {
    const { get } = fakeMangaDex({ details: changed, feeds: { ...both, m1: new Error("x") } });
    const { deps, sent } = pollDeps(repo, get);
    await runPoll(deps);
    expect(sent).toHaveLength(1);
    expect(repo.series.get("m2")?.highest).toBe(2);
  });

  test("a lost channel stops the run", async () => {
    const { get, paths } = fakeMangaDex({ details: changed, feeds: both });
    const { deps } = pollDeps(repo, get, [{ result: "lost-channel" }]);
    await runPoll(deps);
    expect(paths).not.toContain("/manga/m2/feed");
  });

  test("a post Discord refuses skips that series only, to retry next run", async () => {
    const { get } = fakeMangaDex({ details: changed, feeds: both });
    const { deps, sent } = pollDeps(repo, get, [{ result: "failed" }]);
    await runPoll(deps);
    expect(sent).toHaveLength(2);
    expect(repo.series.get("m1")).toMatchObject({ highest: 1, latestUpload: "old" });
    expect(repo.series.get("m2")?.highest).toBe(2);
  });

  test("the pre-check failing rejects before any send", async () => {
    const { get } = fakeMangaDex({ details: new Error("down"), feeds: both });
    const { deps, sent } = pollDeps(repo, get);
    expect(
      await runPoll(deps).then(
        () => "ok",
        () => "rejected",
      ),
    ).toBe("rejected");
    expect(sent).toHaveLength(0);
  });

  test("no follows, no requests; old oneshot ids are pruned", async () => {
    repo.follows.remove("m1", "u1");
    repo.follows.remove("m2", "u1");
    repo.unnumbered.add("o1", NOW - 31 * 24 * 3_600_000);
    const { get, paths } = fakeMangaDex({ details: changed, feeds: both });
    await runPoll(pollDeps(repo, get).deps);
    expect(paths).toEqual([]);
    expect(repo.unnumbered.ids().size).toBe(0);
  });
});
