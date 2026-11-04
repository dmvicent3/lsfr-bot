import {
  type APIContainerComponent,
  type APIMediaGalleryComponent,
  type APITextDisplayComponent,
  ComponentType,
} from "discord.js";
import { nextKind } from "../place.ts";
import { FLEET, type Game, type Outcome } from "../types.ts";
import { firingControls, placingControls } from "./controls.ts";
import { fleetSvg, ownSvg, watersSvg } from "./grids-svg.ts";
import { accuracyLines, jevosAfloat, lastShots, resultLine, yourAfloat } from "./lines.ts";
import type { BoardMessage, GameView } from "./types.ts";

export const TITLE = "🚢 Hidden fleet";

export const EMBED_COLOR = 0x1d6fa5;

/** The grids picture's file name, which the board's gallery shows. */
export const FLEET_FILE = "fleet.png";

export const players = (g: Game): string => `<@${g.playerId}> vs jevos · ${g.difficulty}`;

const text = (content: string): APITextDisplayComponent => ({
  type: ComponentType.TextDisplay,
  content,
});

const GALLERY: APIMediaGalleryComponent = {
  type: ComponentType.MediaGallery,
  items: [{ media: { url: `attachment://${FLEET_FILE}` } }],
};

/** The board's card: its title, its text lines and the grids picture. */
const card = (title: string, lines: string[]): APIContainerComponent => ({
  type: ComponentType.Container,
  accent_color: EMBED_COLOR,
  components: [text(`### ${title}`), text(lines.join("\n")), GALLERY],
});

function placing(g: Game): BoardMessage {
  const kind = nextKind(g.player.ships);
  const ship = kind === null ? null : FLEET[kind];
  const next = ship ? `Place your ${ship.name} (${ship.size})` : "Fleet ready: press Ready.";

  return {
    components: [
      card(`${TITLE} — place your fleet`, [players(g), "", next]),
      ...placingControls(g),
    ],
    svg: fleetSvg(g, { preview: true }),
  };
}

function playing(g: Game, aiming: boolean): BoardMessage {
  const status = aiming ? "jevos is aiming…" : "Your shot.";
  const lines = [players(g), "", jevosAfloat(g), yourAfloat(g), ...lastShots(g), status];

  return {
    // Kept while aiming: a restart or failed edit mid-turn leaves this board, and a click resumes.
    components: [card(TITLE, lines), ...firingControls(g)],
    svg: watersSvg(g, { reveal: false }),
  };
}

function over(g: Game, o: Exclude<Outcome, { kind: "playing" }>): BoardMessage {
  const lines = [players(g), "", ...lastShots(g), resultLine(g, o), ...accuracyLines(g)];

  return {
    components: [card(TITLE, lines)],
    svg: watersSvg(g, { reveal: true }),
  };
}

/** The second message once firing starts: the player's fleet under jevos's shots. */
export const renderFleet = (g: Game): BoardMessage => ({
  components: [card(`${TITLE} — your fleet`, [players(g)])],
  svg: ownSvg(g),
});

/** The board message for a game as it stands; the adapter turns `svg` into the attached picture. */
export function renderGame(v: GameView): BoardMessage {
  if (v.outcome.kind !== "playing") return over(v.game, v.outcome);

  return v.game.phase === "placing" ? placing(v.game) : playing(v.game, v.aiming);
}
