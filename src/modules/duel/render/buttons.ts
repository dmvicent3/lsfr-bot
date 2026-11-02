import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { flag } from "../../../core/countries/flag.ts";
import type { Question, Side } from "../types.ts";

type Row = APIActionRowComponent<APIButtonComponentWithCustomId>;

const button = (
  custom_id: string,
  label: string,
  style: APIButtonComponentWithCustomId["style"],
): APIButtonComponentWithCustomId => ({ type: ComponentType.Button, custom_id, label, style });

const row = (components: APIButtonComponentWithCustomId[]): Row => ({
  type: ComponentType.ActionRow,
  components,
});

/** The two countries as buttons; the date and number let an old message still resolve. */
export function pickButtons(date: string, n: number, q: Question): Row[] {
  const pick = (key: "a" | "b", s: Side) =>
    button(`duel:pick:${date}:${n}:${key}`, `${flag(s.iso2)} ${s.name}`, ButtonStyle.Secondary);

  return [row([pick("a", q.a), pick("b", q.b)])];
}

export const nextButton = (date: string): Row[] => [
  row([button(`duel:next:${date}`, "Next", ButtonStyle.Primary)]),
];
