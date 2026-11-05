import { untilNext } from "../../../core/daily.ts";
import { reply } from "../../../core/replies.ts";
import { submitGuess } from "../play/guess.ts";
import { todayPuzzle } from "../play/today.ts";
import { postShare } from "../post-share.ts";
import { puzzleNumber } from "../puzzle-date.ts";
import { gameText } from "../render/game.ts";
import { shareText } from "../render/share.ts";
import { wordSettings } from "../settings.ts";
import type { Game, Puzzle } from "../types.ts";
import { refusalText } from "../validate.ts";
import { wordLists } from "../words/load.ts";
import type { CommandCtx } from "./types.ts";

/** The spoiler-free grid for the channel. */
const share = (puzzle: Puzzle, game: Game): string =>
  shareText({
    userId: game.userId,
    number: puzzleNumber(puzzle.date),
    guesses: game.guesses,
    answer: puzzle.word,
    won: game.won ?? false,
  });

export async function guess({ i, guildId, db, repo, random }: CommandCtx): Promise<void> {
  const { timeZone, ...settings } = wordSettings(db, guildId);
  const now = Date.now();
  const puzzle = todayPuzzle(repo, { guildId, settings: { ...settings, timeZone }, now, random });
  const accepted = wordLists(puzzle.length)?.accepted ?? new Set<string>();
  const text = i.options.getString("word", true);
  const result = submitGuess(db, repo, { puzzle, userId: i.user.id, text, accepted, now });

  if (result.kind === "refused") {
    const wait = untilNext(now, timeZone);

    return reply(
      i,
      refusalText(result.reason, {
        ...puzzle,
        name: "Word",
        number: puzzleNumber(puzzle.date),
        wait,
      }),
    );
  }

  const award = result.kind === "finished" ? result.award : null;
  await reply(i, gameText({ puzzle, game: result.game, award, now, timeZone }));

  if (result.kind === "finished") await postShare(i, share(puzzle, result.game));
}
