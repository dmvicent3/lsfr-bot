import { ButtonStyle } from "discord.js";
import { button, type Row, row } from "../../../core/buttons.ts";
import { flag } from "../../../core/countries/flag.ts";
import type { Question, Side } from "../types.ts";

/** The two countries as buttons; the date and number let an old message still resolve. */
export function pickButtons(date: string, n: number, q: Question): Row[] {
  const pick = (key: "a" | "b", s: Side) =>
    button(`duel:pick:${date}:${n}:${key}`, `${flag(s.iso2)} ${s.name}`, ButtonStyle.Secondary);

  return [row([pick("a", q.a), pick("b", q.b)])];
}

export const nextButton = (date: string): Row[] => [
  row([button(`duel:next:${date}`, "Next", ButtonStyle.Primary)]),
];
