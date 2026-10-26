import { describe, expect, test } from "bun:test";
import { list } from "../../../../src/modules/manga/commands/list.ts";
import { series } from "../store/fixtures.ts";
import { fakeCommand } from "./fake.ts";

describe("/manga list", () => {
  test("no follows yet", async () => {
    const { ctx, replies } = fakeCommand();
    await list(ctx);
    expect(replies).toEqual(["No follows yet. Add one with `/manga follow`."]);
  });

  test("follows by title with the latest chapter seen", async () => {
    const { ctx, replies } = fakeCommand();
    ctx.repo.series.add(series({ id: "m1", title: "Zom 100", highest: 10.5 }));
    ctx.repo.series.add(series({ id: "m2", title: "Akane", highest: null }));
    ctx.repo.follows.add("m1", "u1");
    ctx.repo.follows.add("m2", "u1");
    await list(ctx);
    expect(replies).toEqual([
      "- [Akane](https://mangadex.org/title/m2) · Ch.—\n- [Zom 100](https://mangadex.org/title/m1) · Ch.10.5",
    ]);
  });

  test("a long list fits one message", async () => {
    const { ctx, replies } = fakeCommand();

    for (let k = 0; k < 100; k++) {
      ctx.repo.series.add(series({ id: `id-${k}`.padEnd(36, "x"), title: "T".repeat(60) }));
      ctx.repo.follows.add(`id-${k}`.padEnd(36, "x"), "u1");
    }

    await list(ctx);
    expect(replies[0]?.length).toBeLessThanOrEqual(2000);
  });
});
