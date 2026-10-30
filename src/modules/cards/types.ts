/** One card: `s:p<n>` / `s:a<n>` from the starter deck, `c:<row id>` added in a server. */
export interface Card {
  id: string;
  text: string;
}

export interface Prompt extends Card {
  blanks: 1 | 2;
}

export interface Deck {
  prompts: readonly Prompt[];
  answers: readonly Card[];
}

/** Cards still to draw, and the ones played that go back in when it runs out. */
export interface Pile<T> {
  draw: T[];
  discard: T[];
}
