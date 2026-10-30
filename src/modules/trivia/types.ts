export type Difficulty = "easy" | "medium" | "hard";

/** One Open Trivia DB question; `typed` ones are asked as free text, `choice` ones with buttons. */
export interface Question {
  id: number;
  category: string;
  difficulty: Difficulty;
  question: string;
  answer: string;
  wrong: string[];
  kind: "typed" | "choice";
  /** Other accepted typed answers (a surname, a short form). */
  aliases?: string[];
  /** A Commons file shown with the question (picture rounds). */
  image?: string;
}

export interface KaosItem {
  answer: string;
  aliases?: string[];
}

/** A KAOS prompt and every answer it accepts. */
export interface KaosList {
  id: number;
  prompt: string;
  items: KaosItem[];
}

export type RoundKind = "typed" | "button" | "kaos";

/** What the next round asks. */
export type RoundChoice =
  | { kind: "typed" | "button"; question: Question }
  | { kind: "kaos"; list: KaosList };

export type Period = "today" | "week" | "month" | "all";
