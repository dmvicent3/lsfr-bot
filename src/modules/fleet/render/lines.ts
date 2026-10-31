import { playerShots } from "../game.ts";
import { cellName } from "../grid.ts";
import { hits, shotResult, sunkShips } from "../shots.ts";
import { FLEET, type Game, type Outcome, type Side } from "../types.ts";

/** "You fired at C5: hit!" for the last shot of `by` at `target`; null before any shot. */
function lastShot(who: string, target: Side, by: Side, owner: string): string | null {
  const cell = by.shots.at(-1);

  if (cell === undefined) return null;

  const r = shotResult(target.ships, by.shots, cell);
  const what = r.kind === "miss" ? "miss." : "hit!";
  const sunk = r.kind === "hit" && r.sunk ? ` Sunk ${owner} ${FLEET[r.ship]?.name}!` : "";

  return `${who} fired at ${cellName(cell)}: ${what}${sunk}`;
}

export function lastShots(g: Game): string[] {
  const mine = lastShot("You", g.jevos, g.player, "jevos's");
  const theirs = lastShot("jevos", g.player, g.jevos, "your");

  return [mine, theirs].filter((l): l is string => l !== null);
}

function afloat(side: Side, shots: number[]): string {
  const sunk = new Set(sunkShips(side.ships, shots));
  const names = side.ships.filter((s) => !sunk.has(s.kind)).map((s) => FLEET[s.kind]?.name);

  return names.length > 0 ? names.join(", ") : "none";
}

export const yourAfloat = (g: Game): string =>
  `Your ships afloat: ${afloat(g.player, g.jevos.shots)}`;

export const jevosAfloat = (g: Game): string =>
  `jevos's ships afloat: ${afloat(g.jevos, g.player.shots)}`;

const accuracy = (who: string, target: Side, by: Side): string => {
  const shots = by.shots.length;
  const hit = hits(target.ships, by.shots);
  const pct = shots > 0 ? Math.round((hit / shots) * 100) : 0;

  return `${who}: ${hit}/${shots} hits (${pct}%)`;
};

export const accuracyLines = (g: Game): string[] => [
  accuracy("You", g.jevos, g.player),
  accuracy("jevos", g.player, g.jevos),
];

const ENDINGS = { resigned: "You resigned.", abandoned: "Abandoned." } as const;

export function resultLine(g: Game, o: Exclude<Outcome, { kind: "playing" }>): string {
  if (o.kind !== "win") return ENDINGS[o.kind];

  return o.winner === "player"
    ? `You sank jevos's fleet in ${playerShots(g)} shots!`
    : "jevos sank your fleet.";
}
