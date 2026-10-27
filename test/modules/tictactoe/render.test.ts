import { describe, expect, test } from "bun:test";
import { ButtonStyle, ComponentType } from "discord.js";
import { lockedCopy, renderGame } from "../../../src/modules/tictactoe/render.ts";
import type { Game, GameView, Outcome } from "../../../src/modules/tictactoe/types.ts";
import { board } from "./fixtures.ts";

const GAME: Game = {
  guildId: "g",
  channelId: "c",
  messageId: "m",
  playerId: "u1",
  board: board("X---O----"),
  jevosMark: "O",
  updatedAt: 0,
};
const PLAYING: Outcome = { kind: "playing" };
const view = (over: Partial<GameView> = {}): GameView => ({
  game: GAME,
  outcome: PLAYING,
  thinking: false,
  last: null,
  ...over,
});
const buttons = (v: GameView) => renderGame(v).components.flatMap((r) => r.components);
const text = (v: GameView) => renderGame(v).embeds[0]?.description ?? "";
const end = (outcome: Outcome) => text(view({ outcome }));

describe("renderGame", () => {
  test("the player's turn: numbered empty squares, marks on taken ones, a resign row", () => {
    const m = renderGame(view());
    expect(m.components).toHaveLength(4);
    const [b1, , , , b5, b6] = buttons(view());
    expect(b1).toMatchObject({
      custom_id: "tictactoe:move:1",
      label: "X",
      style: ButtonStyle.Primary,
      disabled: true,
    });
    expect(b5).toMatchObject({
      custom_id: "tictactoe:move:5",
      label: "O",
      style: ButtonStyle.Danger,
      disabled: true,
    });
    expect(b6).toMatchObject({
      custom_id: "tictactoe:move:6",
      label: "6",
      style: ButtonStyle.Secondary,
      disabled: false,
    });
    expect(buttons(view()).at(-1)).toMatchObject({
      custom_id: "tictactoe:resign",
      label: "Resign",
      style: ButtonStyle.Secondary,
      disabled: false,
    });
    expect(m.embeds[0]?.title).toBe("Tic-tac-toe");
    expect(text(view())).toContain("<@u1> 🟦 X vs jevos 🟥 O");
    expect(text(view())).toContain("Your turn.");
  });

  test("while jevos thinks every button is locked", () => {
    expect(buttons(view({ thinking: true })).every((b) => b.disabled)).toBe(true);
    expect(text(view({ thinking: true }))).toContain("jevos is thinking…");
  });

  test("jevos's last move, with its confidence or its guess", () => {
    expect(text(view({ last: { square: 4, share: 0.712 } }))).toContain(
      "jevos took the centre (71% sure)",
    );
    expect(text(view({ last: { square: 2, share: null } }))).toContain(
      "jevos blanked and guessed square 3",
    );
  });

  test("a jevos win lights its line and locks the board", () => {
    const v = view({
      game: { ...GAME, board: board("OX-XO-X-O") },
      outcome: { kind: "win", winner: "jevos", line: [0, 4, 8] },
    });
    const all = buttons(v);
    expect([0, 4, 8].map((s) => all[s]?.style)).toEqual([
      ButtonStyle.Success,
      ButtonStyle.Success,
      ButtonStyle.Success,
    ]);
    expect(all[1]?.style).toBe(ButtonStyle.Primary);
    expect(all.every((b) => b.disabled)).toBe(true);
    expect(text(v)).toContain("jevos wins");
  });

  test("each ending has its line", () => {
    expect(end({ kind: "win", winner: "player", line: [0, 1, 2] })).toContain("You win!");
    expect(end({ kind: "draw" })).toContain("Draw");
    expect(end({ kind: "resigned" })).toContain("You resigned");
  });

  test("an abandoned game loses its buttons", () => {
    const v = view({ outcome: { kind: "abandoned" } });
    expect(renderGame(v).components).toEqual([]);
    expect(text(v)).toContain("Abandoned");
  });
});

describe("lockedCopy", () => {
  test("an old board keeps its look, win line included, with every button disabled", () => {
    const won = renderGame(
      view({
        game: { ...GAME, board: board("OX-XO-X-O") },
        outcome: { kind: "win", winner: "jevos", line: [0, 4, 8] },
      }),
    ).components;
    const live = renderGame(view()).components;
    const copy = lockedCopy(live);
    expect(copy.flatMap((r) => r.components).every((b) => b.disabled)).toBe(true);
    expect(copy[0]?.components[0]).toMatchObject({ custom_id: "tictactoe:move:1", label: "X" });
    expect(lockedCopy(won)[0]?.components[0]?.style).toBe(ButtonStyle.Success);
  });

  test("anything but button rows is dropped", () => {
    expect(lockedCopy([{ type: ComponentType.TextDisplay, content: "hi" }])).toEqual([]);
  });
});
