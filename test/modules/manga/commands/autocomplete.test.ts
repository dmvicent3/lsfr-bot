import { describe, expect, test } from "bun:test";
import { titleChoices } from "../../../../src/modules/manga/commands/autocomplete.ts";
import { responses } from "../fixtures.ts";
import { series } from "../store/fixtures.ts";
import { fakeCommand } from "./fake.ts";

describe("titleChoices", () => {
  test("follow searches MangaDex", async () => {
    const { ctx } = fakeCommand({ get: async () => responses.search });
    const choices = await titleChoices(ctx.repo, ctx.get, {
      sub: "follow",
      typed: "frieren",
      userId: "u1",
    });
    expect(choices[1]).toEqual({
      name: "Frieren at the Funeral -  Dreams About Fern",
      value: "1d55e985-8379-41bc-aeca-acd069bcadd0",
    });
  });

  test("follow with nothing typed, or MangaDex down, offers nothing", async () => {
    const down = fakeCommand({
      get: async () => {
        throw new Error("down");
      },
    });
    const req = { sub: "follow", userId: "u1" };
    expect(await titleChoices(down.ctx.repo, down.ctx.get, { ...req, typed: "x" })).toEqual([]);
    expect(await titleChoices(down.ctx.repo, down.ctx.get, { ...req, typed: "  " })).toEqual([]);
  });

  test("unfollow offers the member's follows", async () => {
    const { ctx } = fakeCommand();
    ctx.repo.series.add(series({ id: "m1", title: "Akane" }));
    ctx.repo.follows.add("m1", "u1");
    const choices = await titleChoices(ctx.repo, ctx.get, {
      sub: "unfollow",
      typed: "ak",
      userId: "u1",
    });
    expect(choices).toEqual([{ name: "Akane", value: "m1" }]);
  });
});
