/** One matched letter: its index in the guess and in the answer. */
export interface Link {
  g: number;
  a: number;
}

export type Colour = "green" | "yellow" | "dark";

/** One letter of a guess as the board shows it. */
export interface Tile {
  letter: string;
  colour: Colour;
  /** Drawn as one bar with the next tile: both green, on neighbouring answer letters. */
  joinNext: boolean;
  /** The guess's first letter, green on the answer's first: the guess starts as the word does. */
  capStart: boolean;
  /** The guess's last letter, green on the answer's last: the guess ends as the word does. */
  capEnd: boolean;
}

/** One player's daily game; `guesses` oldest first. */
export interface Game {
  guildId: string;
  date: string;
  userId: string;
  guesses: string[];
  solved: boolean | null;
  points: number | null;
  streak: number | null;
  startedAt: number;
  finishedAt: number | null;
}

/** A player's practice round: its own answer, no scoring. */
export interface Practice {
  guildId: string;
  userId: string;
  answer: string;
  guesses: string[];
  startedAt: number;
  finishedAt: number | null;
}

export interface Award {
  points: number;
  parts: string[];
}

/** Why a guess was turned away; it is not counted. */
export type Refusal = "finished" | "letters" | "length" | "unknown" | "repeat";

export type GuessCheck = { ok: true; word: string } | { ok: false; reason: Refusal };

/** Where a search stands: the next guess letter, the last matched answer letter, and whether the previous guess letter was matched there. */
export interface MatchState {
  from: number;
  after: number;
  joined: boolean;
}

/** The lengths of the guess and the answer, for telling their first and last letters. */
export interface Ends {
  guess: number;
  answer: number;
}
