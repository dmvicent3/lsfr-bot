import { describe, expect, test } from "bun:test";
import { type APIButtonComponentWithCustomId, ComponentType } from "discord.js";
import { controls } from "../../../../src/modules/minesweeper/render/controls.ts";
import type { Controls, Game } from "../../../../src/modules/minesweeper/types.ts";
import { game } from "../fixtures.ts";

const NINE = Array.from({ length: 9 }, () => ".........");

const ids = (g: Game) =>
  controls(g).map((r) => r.components.map((c) => ("custom_id" in c ? c.custom_id : "")));

const buttons = (g: Game) =>
  controls(g).flatMap((r) =>
    r.components.filter(
      (c): c is APIButtonComponentWithCustomId =>
        c.type === ComponentType.Button && "custom_id" in c,
    ),
  );

const at = (mode: Controls, cursor = 40) => game(NINE, { cursor, controls: mode });

describe("controls", () => {
  test("arrows: a game pad around Reveal", () => {
    expect(ids(at("arrows"))).toEqual([
      ["minesweeper:flag", "minesweeper:move:up", "minesweeper:giveup"],
      ["minesweeper:move:left", "minesweeper:reveal", "minesweeper:move:right"],
      ["minesweeper:blank:1", "minesweeper:move:down", "minesweeper:blank:2"],
    ]);
  });

  test("arrows: the corner fillers are disabled", () => {
    const fillers = buttons(at("arrows")).filter((b) => b.custom_id.includes("blank"));
    expect(fillers.map((b) => [b.label, b.disabled])).toEqual([
      ["·", true],
      ["·", true],
    ]);
  });

  test("both: menus, an arrow row, then the actions", () => {
    expect(ids(at("both"))).toEqual([
      ["minesweeper:col"],
      ["minesweeper:row"],
      [
        "minesweeper:move:left",
        "minesweeper:move:up",
        "minesweeper:move:down",
        "minesweeper:move:right",
      ],
      ["minesweeper:reveal", "minesweeper:flag", "minesweeper:giveup"],
    ]);
  });

  test("menus: unchanged, no arrows", () => {
    expect(
      ids(at("menus"))
        .flat()
        .some((id) => id.includes("move")),
    ).toBe(false);
  });

  test("arrows that would leave the board are disabled", () => {
    const disabled = buttons(at("arrows", 0))
      .filter((b) => b.custom_id.includes("move") && b.disabled)
      .map((b) => b.custom_id);
    expect(disabled).toEqual(["minesweeper:move:up", "minesweeper:move:left"]);
  });
});
