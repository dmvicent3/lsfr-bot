import { nextKind } from "../place.ts";
import { FLEET, type Game, type Outcome } from "../types.ts";
import { firingControls, placingControls } from "./controls.ts";
import { ownGrid, targetGrid } from "./grid.ts";
import { accuracyLines, afloatLines, lastShots, resultLine } from "./lines.ts";
import type { BoardMessage, GameView } from "./types.ts";

export const TITLE = "🚢 Hidden fleet";

const EMBED_COLOR = 0x1d6fa5;

const players = (g: Game): string => `<@${g.playerId}> vs jevos · ${g.difficulty}`;

function placing(g: Game): BoardMessage {
  const kind = nextKind(g.player.ships);
  const ship = kind === null ? null : FLEET[kind];
  const next = ship ? `Place your ${ship.name} (${ship.size})` : "Fleet ready: press Ready.";
  const lines = [players(g), "", ownGrid(g, true), "", next];

  return {
    embeds: [
      { title: `${TITLE} — place your fleet`, color: EMBED_COLOR, description: lines.join("\n") },
    ],
    components: placingControls(g),
  };
}

function grids(g: Game, reveal: boolean): string[] {
  return ["**Your fleet**", ownGrid(g, false), "", "**jevos's waters**", targetGrid(g, reveal)];
}

function playing(g: Game, aiming: boolean): BoardMessage {
  const status = aiming ? "jevos is aiming…" : "Your shot.";
  const lines = [
    players(g),
    "",
    ...grids(g, false),
    "",
    ...afloatLines(g),
    ...lastShots(g),
    status,
  ];

  return {
    embeds: [{ title: TITLE, color: EMBED_COLOR, description: lines.join("\n") }],
    // Kept while aiming: a restart or failed edit mid-turn leaves this board, and a click resumes.
    components: firingControls(g),
  };
}

function over(g: Game, o: Exclude<Outcome, { kind: "playing" }>): BoardMessage {
  const lines = [
    players(g),
    "",
    ...grids(g, true),
    "",
    ...lastShots(g),
    resultLine(g, o),
    ...accuracyLines(g),
  ];

  return {
    embeds: [{ title: TITLE, color: EMBED_COLOR, description: lines.join("\n") }],
    components: [],
  };
}

/** The board message for a game as it stands. */
export function renderGame(v: GameView): BoardMessage {
  if (v.outcome.kind !== "playing") return over(v.game, v.outcome);

  return v.game.phase === "placing" ? placing(v.game) : playing(v.game, v.aiming);
}
