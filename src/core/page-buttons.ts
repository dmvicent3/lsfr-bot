import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ButtonStyle,
  ComponentType,
} from "discord.js";

type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;

const button = (id: string, label: string, disabled: boolean): APIButtonComponentWithCustomId => ({
  type: ComponentType.Button,
  custom_id: id,
  label,
  style: ButtonStyle.Secondary,
  disabled,
});

/** ◀ ▶ for a leaderboard with more than one page, IDs `<prefix>:<period>:<page>`; none for one page. */
export function pageButtons(
  prefix: string,
  period: string,
  page: number,
  pages: number,
): ButtonRow[] {
  if (pages <= 1) return [];

  return [
    {
      type: ComponentType.ActionRow,
      components: [
        button(`${prefix}:${period}:${page - 1}`, "◀", page <= 1),
        button(`${prefix}:${period}:${page + 1}`, "▶", page >= pages),
      ],
    },
  ];
}
