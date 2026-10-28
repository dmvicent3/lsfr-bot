import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { Period } from "../types.ts";

type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;

const button = (
  period: Period,
  to: number,
  label: string,
  disabled: boolean,
): APIButtonComponentWithCustomId => ({
  type: ComponentType.Button,
  custom_id: `word:page:${period}:${to}`,
  label,
  style: ButtonStyle.Secondary,
  disabled,
});

/** ◀ ▶ for a leaderboard with more than one page; none for one page. */
export function pageButtons(period: Period, page: number, pages: number): ButtonRow[] {
  if (pages <= 1) return [];

  return [
    {
      type: ComponentType.ActionRow,
      components: [
        button(period, page - 1, "◀", page <= 1),
        button(period, page + 1, "▶", page >= pages),
      ],
    },
  ];
}
