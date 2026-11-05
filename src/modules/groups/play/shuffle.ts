import { shuffle } from "../../trivia/shuffle.ts";
import type { Progress } from "../types.ts";
import { fromHex, toHex } from "./hex.ts";

/** The buttons in a new random order. */
export const reshuffle = <P extends Progress>(p: P, random: () => number): P => ({
  ...p,
  order: toHex(shuffle(fromHex(p.order), random)),
});
