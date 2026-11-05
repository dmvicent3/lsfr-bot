import type { Category, Level } from "../../../../src/modules/groups/types.ts";

export const cat = (
  name: string,
  level: Level,
  words: string[],
  also: string[] = [],
): Category => ({
  name,
  level,
  words,
  also,
});

/** A small bank, one category per level and a spare easy one. */
export const BANK: Category[] = [
  cat("Fish", 0, ["bass", "salmon", "trout", "pike", "cod"]),
  cat("Trees", 1, ["oak", "elm", "ash", "birch", "maple"]),
  cat("Dances", 2, ["tango", "waltz", "polka", "samba", "salsa"]),
  cat("Card games", 3, ["poker", "bridge", "rummy", "snap", "whist"]),
  cat("Birds", 0, ["robin", "crow", "wren", "finch", "swan"]),
];
