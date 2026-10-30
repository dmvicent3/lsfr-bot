import { shuffle } from "../../trivia/shuffle.ts";
import { type Refusal, seat } from "./guard.ts";
import { type Game, VOTE_MS } from "./types.ts";

/** Plays the card by id, so a hand view from before a pick still plays what was clicked. */
export function playCard(
  g: Game,
  c: { roundId: string; userId: string; cardId: string },
): "played" | "first" | "already" | Refusal {
  const s = seat(g, { ...c, phase: "playing" });

  if (typeof s === "string") return s;

  const { round, player } = s;

  if (player.from > g.rounds) return "not-in";

  if (round.plays.has(player.userId)) return "already";

  const at = player.hand.findIndex((x) => x.id === c.cardId);
  const [card] = at < 0 ? [] : player.hand.splice(at, 1);

  if (!card) return "stale";

  const first = round.partial.get(player.userId);

  if (round.prompt.blanks === 2 && !first) {
    round.partial.set(player.userId, card);

    return "first";
  }

  round.partial.delete(player.userId);
  round.plays.set(player.userId, first ? [first, card] : [card]);

  return "played";
}

/** Everyone who could play this round has. */
export const allPlayed = (g: Game): boolean =>
  g.players.filter((p) => p.from <= g.rounds).every((p) => g.round?.plays.has(p.userId));

/** Unfinished picks go back to their hands; under two plays the round is void and they all do. */
export function openVoting(g: Game, now: number, random: () => number): "voting" | "void" {
  const round = g.round;

  if (!round) return "void";

  const back = (userId: string, cards: readonly { id: string; text: string }[]) =>
    g.players.find((p) => p.userId === userId)?.hand.push(...cards);

  for (const [userId, card] of round.partial) back(userId, [card]);

  round.partial.clear();
  round.played = [...round.plays.keys()];

  if (round.plays.size < 2) {
    for (const [userId, cards] of round.plays) back(userId, cards);

    round.plays.clear();

    return "void";
  }

  round.order = shuffle([...round.plays.keys()], random);
  g.phase = "voting";
  g.deadline = now + VOTE_MS;

  return "voting";
}
