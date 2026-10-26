import type { Championship, Standings } from "./types.ts";
import type { SeriesInfo, SeriesKey } from "../types.ts";
import { fitName, fitTeam, formatTable, posLabel, tableMessage } from "../format.ts";

const TITLE: Record<SeriesKey, Record<Championship, string>> = {
  f1: { drivers: "Drivers'", constructors: "Constructors'" },
  motogp: { drivers: "Riders'", constructors: "Constructors'" },
  wec: { drivers: "Drivers'", constructors: "Manufacturers'" },
  wrc: { drivers: "Drivers'", constructors: "Manufacturers'" },
  indycar: { drivers: "Drivers'", constructors: "Manufacturers'" },
  fe: { drivers: "Drivers'", constructors: "Teams'" },
  f2: { drivers: "Drivers'", constructors: "Teams'" },
  f3: { drivers: "Drivers'", constructors: "Teams'" },
};

export function renderStandings(
  info: SeriesInfo,
  champ: Championship,
  standings: Standings,
): string {
  const after = standings.round === null ? "" : ` (after round ${standings.round})`;
  const heading = `## 🏆 ${info.name} — ${TITLE[info.key][champ]} standings${after}`;

  if (standings.rows.length === 0) return `${heading}\nNo standings yet.`;

  const lines =
    champ === "drivers"
      ? formatTable(
          standings.rows.map((r) => [
            posLabel(r.pos),
            fitName(r.name),
            fitTeam(r.team),
            r.points,
            `${r.wins}W`,
          ]),
          new Set([3, 4]),
        )
      : formatTable(
          standings.rows.map((r) => [posLabel(r.pos), fitName(r.name), r.points, `${r.wins}W`]),
          new Set([2, 3]),
        );

  return tableMessage(heading, lines);
}
