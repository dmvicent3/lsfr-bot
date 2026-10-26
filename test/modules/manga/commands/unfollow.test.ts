import { describe, expect, test } from "bun:test";
import { unfollow } from "../../../../src/modules/manga/commands/unfollow.ts";
import { series } from "../store/fixtures.ts";
import { fakeCommand } from "./fake.ts";

describe("/manga unfollow", () => {
  test("unfollows, and says so when not following", async () => {
    const { ctx, replies } = fakeCommand({ strings: { title: "m1" } });
    ctx.repo.series.add(series());
    ctx.repo.follows.add("m1", "u1");
    await unfollow(ctx);
    await unfollow(ctx);
    expect(replies).toEqual(["Unfollowed.", "You don't follow that one; pick one from the list."]);
    expect(ctx.repo.series.get("m1")).not.toBeNull();
  });
});
