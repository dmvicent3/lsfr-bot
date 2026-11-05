import { dateIn } from "../../../core/zoned.ts";
import { todayPuzzle } from "../play/today.ts";
import type { WordRepo } from "../store/repo.ts";
import type { WordSettings } from "../types.ts";
import { wordLists } from "../words/load.ts";
import { chooseWords } from "./choose.ts";
import { MODES } from "./modes.ts";
import type { Mode, MultiPuzzle } from "./types.ts";

/**
 * Today's puzzle for `mode`, created on first use: the classic word of the day sets the length
 * and is left out; words any word puzzle in the server had are avoided while others remain.
 */
export function todayMulti(
  repo: WordRepo,
  s: { guildId: string; settings: WordSettings; now: number; random: () => number },
  mode: Mode,
): MultiPuzzle {
  const existing = repo.multiPuzzles.get(s.guildId, mode, dateIn(s.now, s.settings.timeZone));

  if (existing) return existing;

  const classic = todayPuzzle(repo, s);
  const used = new Set([
    ...repo.puzzles.usedWords(s.guildId),
    ...repo.multiPuzzles.usedWords(s.guildId),
  ]);
  const words = chooseWords(
    wordLists(classic.length)?.answers ?? [],
    { used, exclude: [classic.word], count: MODES[mode].boards },
    s.random,
  );

  return repo.multiPuzzles.create({ ...classic, mode, words });
}
