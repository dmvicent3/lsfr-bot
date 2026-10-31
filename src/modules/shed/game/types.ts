export type Colour = "red" | "yellow" | "green" | "blue";

export type Value =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "block"
  | "turn"
  | "plus2"
  | "paint"
  | "paint4";

/** One card; Paint and Paint +4 have no colour. */
export interface Card {
  id: number;
  colour: Colour | null;
  value: Value;
}

/** A waiting draw against the current player, grown by answering it in kind. */
export interface Pending {
  kind: "plus2" | "paint4";
  total: number;
}
