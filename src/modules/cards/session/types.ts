import type { Poster } from "../../trivia/session/types.ts";
import type { Game } from "../game/types.ts";
import type { CardsRepo } from "../store/repo.ts";
import type { Deck } from "../types.ts";

export interface Who {
  userId: string;
  name: string;
}

export interface Click {
  roundId: string;
  userId: string;
  index: number;
}

export interface PlayClick {
  roundId: string;
  userId: string;
  cardId: string;
}

export interface RunnerInit {
  gameId: number;
  guildId: string;
  channelId: string;
  starter: Who;
  target: number;
  deck: Deck;
  now: number;
}

export interface Deps {
  repo: CardsRepo;
  poster: Poster;
  random: () => number;
  /** Called once when the game ends, to drop its timer and registry entry. */
  onEnd: () => void;
}

/** A live game and the message that shows its current phase. */
export interface Live {
  game: Game;
  messageId: string | null;
  /** A click changed what the current message shows. */
  dirty: boolean;
  /** A post found the channel gone; the game then ends without a word. */
  lost: boolean;
  ended: boolean;
}
