import { join, newGame, startGame } from "../../../src/modules/cards/game/lobby.ts";
import type { Game } from "../../../src/modules/cards/game/types.ts";
import type { Deck } from "../../../src/modules/cards/types.ts";

export { scripted } from "../trivia/fixtures.ts";

export const T0 = Date.UTC(2026, 9, 30, 20);

/** `prompts` one-blank prompts (the first `two` with two blanks) and `answers` answers. */
export function deck(prompts = 10, answers = 60, two = 0): Deck {
  return {
    prompts: Array.from({ length: prompts }, (_, i) =>
      i < two
        ? { id: `p${i}`, text: `P${i} ___ and ___`, blanks: 2 as const }
        : { id: `p${i}`, text: `P${i} ___`, blanks: 1 as const },
    ),
    answers: Array.from({ length: answers }, (_, i) => ({ id: `a${i}`, text: `A${i}` })),
  };
}

export function game(over: { deck?: Deck; target?: number } = {}): Game {
  return newGame({
    id: 1,
    guildId: "g",
    channelId: "c",
    starter: { userId: "u1", name: "Ana" },
    target: over.target ?? 7,
    deck: over.deck ?? deck(),
    random: Math.random,
    now: T0,
  });
}

/** A started game with players u1 (Ana), u2 (Bo), u3 (Cy). */
export function started(over: { deck?: Deck; target?: number } = {}): Game {
  const g = game(over);
  joinAll(g, ["u2", "u3"]);
  startOrThrow(g);

  return g;
}

export function joinAll(g: Game, ids: string[]): void {
  for (const id of ids) join(g, { userId: id, name: id.toUpperCase() }, Math.random);
}

function startOrThrow(g: Game): void {
  if (startGame(g, "u1", T0, Math.random) !== "started") throw new Error("could not start");
}

/** The id of the card at `index` in a player's hand ("" when there is none). */
export const cardAt = (g: Game, userId: string, index = 0): string =>
  g.players.find((p) => p.userId === userId)?.hand[index]?.id ?? "";
