import type { Stats } from "../types.ts";
import { clock } from "./clock.ts";

export function renderStats(stats: Stats | null, name: string): string {
  if (!stats) return "No finished games yet.";

  const pct = Math.round((stats.wins / stats.games) * 100);
  const head = `**${name}** — ${stats.games} games, ${stats.wins} wins (${pct}%) · streak ${stats.streak} (best ${stats.bestStreak})`;
  const lines = stats.setups.map(
    (l) => `${l.label}: best ${clock(l.bestSeconds)} · ${l.wins}/${l.games} won`,
  );

  return [head, ...lines].join("\n");
}
