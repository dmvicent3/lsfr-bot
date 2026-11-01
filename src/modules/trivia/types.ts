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

/** One picture round's item, built from Wikidata; ids from 100001 never meet Open Trivia DB ids. */
export interface Picture {
  id: number;
  /** The Wikidata item, so re-runs keep ids. */
  qid: string;
  category: string;
  prompt: string;
  /** Commons file name; never shown, since it usually names the answer. */
  image: string;
  answer: string;
  aliases: string[];
  difficulty: Difficulty;
}

/** What rounds are drawn from. */
export interface Bank {
  questions: readonly Question[];
  lists: readonly KaosList[];
  pictures: readonly Picture[];
}

/** One round draw: the bank, when each item was last asked, the chosen topic, randomness. */
export interface PickParams extends Bank {
  lastAsked: ReadonlyMap<string, number>;
  topic: string | null;
  random: () => number;
  /** No typed rounds: no KAOS, text questions with options only, pictures as buttons. */
  buttonsOnly?: boolean;
}
