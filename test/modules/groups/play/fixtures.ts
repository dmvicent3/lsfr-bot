import type { Progress, Puzzle } from "../../../../src/modules/groups/types.ts";

/** Group g holds words 4g..4g+3. */
export const PUZZLE: Puzzle = {
  groups: [
    { name: "Fish", level: 0, words: ["bass", "salmon", "trout", "pike"] },
    { name: "Trees", level: 1, words: ["oak", "elm", "ash", "birch"] },
    { name: "Dances", level: 2, words: ["tango", "waltz", "polka", "samba"] },
    { name: "Card games", level: 3, words: ["poker", "bridge", "rummy", "whist"] },
  ],
  order: "0123456789abcdef",
};

export const progress = (over: Partial<Progress> = {}): Progress => ({
  order: PUZZLE.order,
  picked: "",
  found: "",
  guesses: "",
  mistakes: 0,
  lastLine: null,
  ...over,
});
