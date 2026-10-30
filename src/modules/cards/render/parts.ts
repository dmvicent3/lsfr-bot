import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType,
  escapeMarkdown,
} from "discord.js";
import type { Game } from "../game/types.ts";

type Style = ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;

export type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;

export const TITLE = "🃏 Gork Cards";
const PER_ROW = 5;
const MAX_LABEL = 80;

export const button = (
  id: string,
  label: string,
  style: Style = ButtonStyle.Secondary,
): APIButtonComponentWithCustomId => ({
  type: ComponentType.Button,
  custom_id: id,
  label: label.slice(0, MAX_LABEL),
  style,
});

/** Five buttons a row, at most five rows. */
export function rows(buttons: APIButtonComponentWithCustomId[]): ButtonRow[] {
  const out: ButtonRow[] = [];

  for (let i = 0; i < buttons.length && out.length < PER_ROW; i += PER_ROW)
    out.push({ type: ComponentType.ActionRow, components: buttons.slice(i, i + PER_ROW) });

  return out;
}

export const nameOf = (g: Game, userId: string): string =>
  escapeMarkdown(g.names.get(userId) ?? "someone");

/** Points so far, most first. */
export function standings(g: Game): string {
  const list = [...g.points].toSorted((a, b) => b[1] - a[1]);

  if (list.length === 0) return "No points yet.";

  return list.map(([id, n]) => `${nameOf(g, id)} ${n}`).join(" · ");
}

/** A Discord relative timestamp, "in 42 seconds". */
export const until = (ms: number): string => `<t:${Math.ceil(ms / 1000)}:R>`;
