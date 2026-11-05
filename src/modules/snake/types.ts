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
  /** Green on the answer's first letter: the word starts here. */
  capStart: boolean;
  /** Green on the answer's last letter: the word ends here. */
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
