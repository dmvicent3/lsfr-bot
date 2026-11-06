import type { APIActionRowComponent, APIComponentInMessageActionRow, APIEmbed } from "discord.js";
import type { Award } from "../daily/types.ts";
import { elapsedSeconds } from "../outcome.ts";
import { awardLine, dailyTitle } from "./result.ts";
import type { Game, Result } from "../types.ts";
import { clock } from "./clock.ts";
import { controls } from "./controls.ts";
import { renderGrid } from "./grid.ts";

const EMBED_COLOR = 0x5865f2;

const ENDINGS: Record<Result, string> = {
  won: "🏆 Won in",
  lost: "💥 Lost after",
  "gave-up": "🏳️ Gave up after",
};

export interface BoardMessage {
  embeds: APIEmbed[];
  components: APIActionRowComponent<APIComponentInMessageActionRow>[];
}

/** The line over the grid: counters while live, how it ended once finished. */
export function headline(game: Game, now: number): string {
  const time = clock(elapsedSeconds(game.startedAt, game.finishedAt ?? now));

  if (game.result) return `${ENDINGS[game.result]} ${time}`;

  const flags = game.cells.filter((c) => c === "flag").length;
  const clicks = game.kind === "daily" ? ` · 🖱 ${game.clicks}/${game.bbbv ?? 0}` : "";

  return `💣 ${game.mines} · ⚑ ${flags}${clicks} · ⏱ ${time}`;
}

const title = (game: Game): string =>
  game.kind === "daily"
    ? `💣 ${dailyTitle(game)}`
    : `💣 Minesweeper — ${game.width}×${game.height}`;

/** A finished daily's points under the grid. */
const tail = (game: Game, award: Award | null): string =>
  game.kind === "daily" && game.result ? `\n${awardLine(game, award)}` : "";

/** The board message; a note (footer) or a result closes it, leaving no controls. */
export function renderBoard(
  game: Game,
  o: { playerName: string; now: number; note?: string; award?: Award | null },
): BoardMessage {
  const embed: APIEmbed = {
    title: title(game),
    author: { name: o.playerName },
    description: `${headline(game, o.now)}\n${renderGrid(game)}${tail(game, o.award ?? null)}`,
    color: EMBED_COLOR,
    ...(o.note ? { footer: { text: o.note } } : {}),
  };
  const live = game.result === null && !o.note;

  return { embeds: [embed], components: live ? controls(game) : [] };
}
