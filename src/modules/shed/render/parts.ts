import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType,
  escapeMarkdown,
} from "discord.js";
import type { Game } from "../game/types.ts";

type Style = ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;

export type Button = APIButtonComponentWithCustomId;
export type ButtonRow = APIActionRowComponent<Button>;

export const TITLE = "🃏 Shed";
const PER_ROW = 5;
const MAX_LABEL = 80;

export const button = (
  id: string,
  label: string,
  style: Style = ButtonStyle.Secondary,
): Button => ({
  type: ComponentType.Button,
  custom_id: id,
  label: label.slice(0, MAX_LABEL),
  style,
});

/** Five buttons a row, at most five rows. */
export function rows(buttons: Button[]): ButtonRow[] {
  const out: ButtonRow[] = [];

  for (let i = 0; i < buttons.length && out.length < PER_ROW; i += PER_ROW)
    out.push({ type: ComponentType.ActionRow, components: buttons.slice(i, i + PER_ROW) });

  return out;
}

/** A seat's display name, markdown-safe. */
export const nameAt = (g: Game, seat: number): string =>
  escapeMarkdown(g.seats[seat]?.name ?? "someone");

/** A Discord relative timestamp, "in 42 seconds". */
export const until = (ms: number): string => `<t:${Math.ceil(ms / 1000)}:R>`;
