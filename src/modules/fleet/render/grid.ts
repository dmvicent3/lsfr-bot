import { jevosToMove } from "../game.ts";
import { shipCells } from "../grid.ts";
import { nextKind } from "../place.ts";
import { sunkShips } from "../shots.ts";
import { FLEET, type Game, SIZE, type Side } from "../types.ts";

const MARK = {
  water: "🟦",
  ship: "⬜",
  hit: "💥",
  miss: "⚪",
  sunk: "🟥",
  cursor: "🟨",
} as const;

/** Column letters as regional indicators, split by U+200B so no pair turns into a flag. */
const HEADER = `🌊${["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"].join("​")}`;

const ROW_LABELS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

/** How one cell of `side`'s waters looks after `shots` from the other side. */
function shotMark(side: Side, shots: Set<number>, sunk: Set<number>, c: number): string | null {
  const ship = side.ships.find((s) => s.cells.includes(c));

  if (!shots.has(c)) return null;

  if (!ship) return MARK.miss;

  return sunk.has(ship.kind) ? MARK.sunk : MARK.hit;
}

function draw(mark: (c: number) => string): string {
  const row = (r: number) => Array.from({ length: SIZE }, (_, c) => mark(r * SIZE + c)).join("");

  return [HEADER, ...ROW_LABELS.map((label, r) => `${label}${row(r)}`)].join("\n");
}

/** The cells the next ship would cover from the cursor; just the cursor when it won't fit. */
function previewCells(g: Game): Set<number> {
  const kind = nextKind(g.player.ships);

  if (kind === null) return new Set();

  return new Set(shipCells(g.cursor, FLEET[kind]?.size ?? 0, g.dir) ?? [g.cursor]);
}

/** The player's own waters: their ships, and jevos's shots on them. */
export function ownGrid(g: Game, preview: boolean): string {
  const shots = new Set(g.jevos.shots);
  const sunk = new Set(sunkShips(g.player.ships, g.jevos.shots));
  const ships = new Set(g.player.ships.flatMap((s) => s.cells));
  const cursor = preview ? previewCells(g) : new Set<number>();

  return draw((c) => {
    if (cursor.has(c)) return MARK.cursor;

    return shotMark(g.player, shots, sunk, c) ?? (ships.has(c) ? MARK.ship : MARK.water);
  });
}

/** jevos's waters as the player sees them; `reveal` shows its unhit ships at the end. */
export function targetGrid(g: Game, reveal: boolean): string {
  const shots = new Set(g.player.shots);
  const sunk = new Set(sunkShips(g.jevos.ships, g.player.shots));
  const ships = new Set(g.jevos.ships.flatMap((s) => s.cells));
  const aimed = !reveal && !jevosToMove(g) ? g.cursor : -1;

  return draw((c) => {
    const shot = shotMark(g.jevos, shots, sunk, c);

    if (shot) return shot;

    if (c === aimed) return MARK.cursor;

    return reveal && ships.has(c) ? MARK.ship : MARK.water;
  });
}
