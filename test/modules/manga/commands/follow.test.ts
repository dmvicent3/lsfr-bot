import { describe, expect, test } from "bun:test";
import { MangaDexError } from "../../../../src/modules/manga/api/client.ts";
import { follow } from "../../../../src/modules/manga/commands/follow.ts";
import { setMangaChannel } from "../../../../src/modules/manga/settings.ts";
import { POLE_STAR, responses } from "../fixtures.ts";
import { series } from "../store/fixtures.ts";
import { fakeCommand } from "./fake.ts";

const down = async () => {
  throw new MangaDexError("HTTP 503", 503);
};

const get = async (path: string) => (path === "/manga" ? responses.details : responses.latest);

describe("/manga follow", () => {
  test("follows, and says a channel is still needed", async () => {
    const { ctx, replies } = fakeCommand({ strings: { title: POLE_STAR }, get });
    await follow(ctx);
    expect(replies).toEqual([
      "📚 Following **POLE STAR**.\nAn admin needs to set a channel with `/manga channel`.",
    ]);
  });

  test("with a channel set, just follows", async () => {
    const { ctx, replies } = fakeCommand({ strings: { title: POLE_STAR }, get });
    setMangaChannel(ctx.db, "c1");
    await follow(ctx);
    expect(replies).toEqual(["📚 Following **POLE STAR**."]);
  });

  test("already following", async () => {
    const { ctx, replies } = fakeCommand({ strings: { title: POLE_STAR }, get });
    setMangaChannel(ctx.db, "c1");
    await follow(ctx);
    await follow(ctx);
    expect(replies[1]).toBe("Already following **POLE STAR**.");
  });

  test("the follow limit", async () => {
    const { ctx, replies } = fakeCommand({ strings: { title: POLE_STAR }, get });

    for (let k = 0; k < 100; k++) {
      ctx.repo.series.add(series({ id: `s${k}` }));
      ctx.repo.follows.add(`s${k}`, "u1");
    }

    await follow(ctx);
    expect(replies).toEqual(["You follow 100 manga already; unfollow one first."]);
  });

  test("an unknown manga", async () => {
    const { ctx, replies } = fakeCommand({ strings: { title: "typed text" }, get });
    await follow(ctx);
    expect(replies).toEqual(["Couldn't find that manga; pick one from the list."]);
  });

  test("MangaDex down", async () => {
    const { ctx, replies } = fakeCommand({ strings: { title: POLE_STAR }, get: down });
    await follow(ctx);
    expect(replies).toEqual(["MangaDex isn't answering; try again in a bit."]);
  });
});
