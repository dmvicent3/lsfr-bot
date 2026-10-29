import { describe, expect, test } from "bun:test";
import { ApplicationCommandOptionType, InteractionContextType } from "discord.js";
import { data } from "../../../src/modules/minesweeper/commands/data.ts";

const sub = (name: string) => data.options?.find((o) => o.name === name);

describe("/minesweeper", () => {
  test("a server command with play and stats", () => {
    expect(data.name).toBe("minesweeper");
    expect(data.description).toBe("Play Minesweeper");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(data.options?.map((o) => o.name)).toEqual(["play", "stats"]);
  });

  test("play takes a difficulty, a size within 5-20 and a mine count", () => {
    const play = sub("play");

    if (play?.type !== ApplicationCommandOptionType.Subcommand) throw new Error("subcommand");

    expect(play.options?.map((o) => o.name)).toEqual(["difficulty", "width", "height", "mines"]);
    const width = play.options?.find((o) => o.name === "width");

    if (width?.type !== ApplicationCommandOptionType.Integer) throw new Error("integer");

    expect([width.min_value, width.max_value]).toEqual([5, 20]);
    const difficulty = play.options?.find((o) => o.name === "difficulty");

    if (difficulty?.type !== ApplicationCommandOptionType.String) throw new Error("string");

    expect(difficulty.choices?.map((c) => c.value)).toEqual(["beginner", "intermediate", "expert"]);
  });

  test("stats takes an optional member", () => {
    const stats = sub("stats");

    if (stats?.type !== ApplicationCommandOptionType.Subcommand) throw new Error("subcommand");

    expect(stats.options?.map((o) => [o.name, o.required ?? false])).toEqual([["member", false]]);
  });
});
