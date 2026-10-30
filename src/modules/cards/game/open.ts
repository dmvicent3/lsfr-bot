import { drawCards } from "./piles.ts";
import { type Game, PLAY_MS } from "./types.ts";

/** Draws the next prompt and opens a 60 s round; no prompt left at all ends the game. */
export function openRound(g: Game, now: number, random: () => number): void {
  const [prompt] = drawCards(g.prompts, 1, random);

  if (!prompt) {
    g.phase = "over";
    g.endReason = "empty";

    return;
  }

  g.rounds += 1;
  g.round = {
    id: `${g.id}-${g.rounds}`,
    prompt,
    plays: new Map(),
    partial: new Map(),
    played: [],
    order: [],
    votes: new Map(),
    winners: [],
  };
  g.phase = "playing";
  g.deadline = now + PLAY_MS;
}
