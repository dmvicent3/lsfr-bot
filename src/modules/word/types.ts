import type { DateRange } from "../../core/types.ts";
import type { WordRepo } from "./store/repo.ts";

/** One length's words: answers to pick from, and every word a guess may be. */
export interface WordLists {
  answers: readonly string[];
  accepted: ReadonlySet<string>;
}

/** One letter's feedback: right place, elsewhere in the word, or not in it. */
export type Mark = "hit" | "near" | "miss";

export type { LastGame } from "../../core/daily.ts";
export type { DateRange, Period } from "../../core/types.ts";

export type RefusedReason = "finished" | "length" | "letters" | "unknown" | "repeat";

/** A guess that counts, or why it doesn't (it then costs no attempt). */
export type GuessCheck = { ok: true; word: string } | { ok: false; reason: RefusedReason };

/** Points for one finished game, with the lines that explain them. */
export interface Award {
  points: number;
  parts: string[];
}

/** A server's word for one date. */
export interface Puzzle {
  guildId: string;
  date: string;
  word: string;
  length: number;
}

/** One player's game on one puzzle; won, points, streak and finishedAt are null while open. */
export interface Game {
  guildId: string;
  date: string;
  userId: string;
  guesses: string[];
  won: boolean | null;
  points: number | null;
  streak: number | null;
  finishedAt: number | null;
}

export type GuessResult =
  | { kind: "refused"; reason: RefusedReason }
  | { kind: "open"; game: Game }
  | { kind: "finished"; game: Game; award: Award };

/** One player's totals over their finished games. */
export interface PlayerStats {
  points: number;
  wins: number;
  losses: number;
  /** wins / (wins + losses); null before any game. */
  winRate: number | null;
  currentStreak: number;
  longestStreak: number;
  totalGuesses: number;
  avgAttempts: number | null;
  /** Wins by attempts: index 0 = solved in 1. */
  distribution: number[];
}

/** One player's row in a period. */
export interface Standing {
  userId: string;
  points: number;
  wins: number;
  games: number;
  avgAttempts: number | null;
  lastFinishedAt: number;
}

export type { LeaderboardPage } from "../../core/leaderboard-page.ts";

/** One word game's history (classic, Duo or Quad), as stats and leaderboards read it. */
export interface Track {
  /** "Word", "Word Duo" */
  name: string;
  /** The command that plays it, "/duo play". */
  play: string;
  firstPuzzle: string;
  maxAttempts: number;
  /** The leaderboard page button ID prefix, "word:page". */
  pagePrefix: string;
  finishedIn(repo: WordRepo, guildId: string, range: DateRange): Game[];
  finishedBy(repo: WordRepo, guildId: string, userId: string): Game[];
}

/** Per-server options; changes apply from the next puzzle. */
export interface WordSettings {
  length: number;
  timeZone: string;
}

/** What a player's guesses say about each letter (lowercase, positions 0-based). */
export interface LetterNotes {
  /** Hit letters with their hit positions, by first position. */
  placed: { letter: string; positions: number[] }[];
  /** In the word but never hit, alphabetical, with every spot tried. */
  near: { letter: string; notAt: number[] }[];
  untried: string[];
  /** Guessed, never hit or near. */
  out: string[];
  /** The hit letter at each position, or null. */
  pattern: (string | null)[];
}

/** Letter notes as text lines: the status groups, and the pattern line (null before a hit). */
export interface NoteLines {
  groups: string[];
  pattern: string | null;
}
