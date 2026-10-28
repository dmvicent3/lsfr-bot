import { log } from "../../../core/log.ts";
import { dateIn } from "../../../core/zoned.ts";
import { chooseWord } from "../choose-word.ts";
import { DEFAULT_SETTINGS } from "../settings.ts";
import type { WordRepo } from "../store/repo.ts";
import type { Puzzle, WordLists, WordSettings } from "../types.ts";
import { wordLists } from "../words/load.ts";

/** The lists for `length`, or the default length's when that one is missing. */
function listsFor(length: number): { length: number; lists: WordLists | null } {
  const lists = wordLists(length);

  if (lists) return { length, lists };

  log.error("word", `no word lists for length ${length}, using ${DEFAULT_SETTINGS.length}`);

  return { length: DEFAULT_SETTINGS.length, lists: wordLists(DEFAULT_SETTINGS.length) };
}

/** Today's puzzle in the server's time zone, created on first use with the current length. */
export function todayPuzzle(
  repo: WordRepo,
  s: { guildId: string; settings: WordSettings; now: number; random: () => number },
): Puzzle {
  const date = dateIn(s.now, s.settings.timeZone);
  const existing = repo.puzzles.get(s.guildId, date);

  if (existing) return existing;

  const { length, lists } = listsFor(s.settings.length);
  const word = chooseWord(lists?.answers ?? [], repo.puzzles.usedWords(s.guildId), s.random);

  return repo.puzzles.create({ guildId: s.guildId, date, word, length });
}
