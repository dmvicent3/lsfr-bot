import type { Poster } from "../../trivia/session/types.ts";
import type { Colour, Game, Who } from "../game/types.ts";
import type { ShedRepo } from "../store/repo.ts";

/** A click on a turn button: who, on which turn, when. */
export interface TurnClick {
  userId: string;
  turnNo: number;
  now: number;
}

export interface PlayClick extends TurnClick {
  key: string;
  count: number;
  last: boolean;
}

export interface KeepClick extends TurnClick {
  last: boolean;
}

export interface PaintClick extends TurnClick {
  colour: Colour;
}

export interface RunnerInit {
  gameId: number;
  guildId: string;
  channelId: string;
  starter: Who;
  stacking: boolean;
  now: number;
}

export interface Deps {
  repo: ShedRepo;
  poster: Poster;
  random: () => number;
  /** Called once when the game ends, to drop its timer and registry entry. */
  onEnd: () => void;
}

/** A live game and its one message: the lobby, then the board. */
export interface Live {
  game: Game;
  messageId: string | null;
  /** A click changed what the board shows. */
  dirty: boolean;
  /** A post found the channel gone; the game then ends without a word. */
  lost: boolean;
  ended: boolean;
  /** The turn's seconds left as last shown, so the countdown edits when its 10 s step changes. */
  shownSeconds: number | null;
}
