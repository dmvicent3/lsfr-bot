/** A word as spaced capitals in backticks, as the letter games show a guess: `` `C R A N E` ``. */
export const spacedCaps = (word: string): string => `\`${word.toUpperCase().split("").join(" ")}\``;
