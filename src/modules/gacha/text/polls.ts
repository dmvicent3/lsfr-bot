import { flag } from "../../../core/countries/flag.ts";
import type { PollRequest } from "../../../core/polls/types.ts";
import type { PollKind } from "../types.ts";
import type { Driver } from "../types.ts";
import { plural } from "./format.ts";

/** Discord's limit on a poll answer. */
const ANSWER_MAX = 55;

const QUESTION: Record<PollKind, string> = {
  five: "Gacha: which ★5 champion leads next week's limited banner?",
  fours: "Gacha: pick next week's three featured ★4 race winners (the top 3 win)",
};

/** "🇧🇷 Ayrton Senna · 3 titles" or "🇬🇧 Stirling Moss · 16 wins", cut to Discord's limit. */
export function answer(d: Driver): string {
  const stat = d.tier === 5 ? plural(d.titles, "title") : plural(d.wins, "win");

  return `${flag(d.country)} ${d.name} · ${stat}`.slice(0, ANSWER_MAX);
}

/** A banner poll: single choice for the ★5, several for the ★4s. */
export const pollRequest = (
  kind: PollKind,
  drivers: readonly Driver[],
  hours: number,
): PollRequest => ({
  question: QUESTION[kind],
  options: drivers.map(answer),
  hours,
  multi: kind === "fours",
});
