import { nextKind } from "../place.ts";
import { FLEET, type Game, type Outcome } from "../types.ts";
import { firingControls, placingControls } from "./controls.ts";
import { battleSvg, fleetSvg } from "./grids-svg.ts";
import { accuracyLines, jevosAfloat, lastShots, resultLine, yourAfloat } from "./lines.ts";
import type { BoardMessage, GameView } from "./types.ts";

export const TITLE = "🚢 Hidden fleet";

export const EMBED_COLOR = 0x1d6fa5;

/** The grids picture's file name, which the embed shows as its image. */
export const FLEET_FILE = "fleet.png";

export const players = (g: Game): string => `<@${g.playerId}> vs jevos · ${g.difficulty}`;

const embed = (title: string, description: string[]) => ({
  title,
  color: EMBED_COLOR,
  description: description.join("\n"),
  image: { url: `attachment://${FLEET_FILE}` },
});

function placing(g: Game): BoardMessage {
  const kind = nextKind(g.player.ships);
  const ship = kind === null ? null : FLEET[kind];
  const next = ship ? `Place your ${ship.name} (${ship.size})` : "Fleet ready: press Ready.";

  return {
    embeds: [embed(`${TITLE} — place your fleet`, [players(g), "", next])],
    components: placingControls(g),
    svg: fleetSvg(g, { preview: true }),
  };
}

function playing(g: Game, aiming: boolean): BoardMessage {
  const status = aiming ? "jevos is aiming…" : "Your shot.";
  const lines = [players(g), "", jevosAfloat(g), yourAfloat(g), ...lastShots(g), status];

  return {
    embeds: [embed(TITLE, lines)],
    // Kept while aiming: a restart or failed edit mid-turn leaves this board, and a click resumes.
    components: firingControls(g),
    svg: battleSvg(g, { reveal: false }),
  };
}

function over(g: Game, o: Exclude<Outcome, { kind: "playing" }>): BoardMessage {
  const lines = [players(g), "", ...lastShots(g), resultLine(g, o), ...accuracyLines(g)];

  return {
    embeds: [embed(TITLE, lines)],
    components: [],
    svg: battleSvg(g, { reveal: true }),
  };
}

/** The board message for a game as it stands; the adapter turns `svg` into the attached picture. */
export function renderGame(v: GameView): BoardMessage {
  if (v.outcome.kind !== "playing") return over(v.game, v.outcome);

  return v.game.phase === "placing" ? placing(v.game) : playing(v.game, v.aiming);
}
