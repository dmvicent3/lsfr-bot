import type { ChatInputCommandInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import { reply } from "../../../core/replies.ts";
import { submitGuess } from "../play/guess.ts";
import { todayPuzzle } from "../play/today.ts";
import { puzzleNumber, untilNext } from "../puzzle-date.ts";
import { gameText } from "../render/game.ts";
import { shareText } from "../render/share.ts";
import { wordSettings } from "../settings.ts";
import type { Game, Puzzle } from "../types.ts";
import { refusalText } from "../validate.ts";
import { wordLists } from "../words/load.ts";
import type { CommandCtx } from "./types.ts";

/** The spoiler-free grid for the channel; the game counts even when this can't be posted. */
async function share(i: ChatInputCommandInteraction, puzzle: Puzzle, game: Game): Promise<void> {
  const text = shareText({
    userId: game.userId,
    number: puzzleNumber(puzzle.date),
    guesses: game.guesses,
    answer: puzzle.word,
    won: game.won ?? false,
  });

  try {
    await i.followUp({ content: text, allowedMentions: { parse: [] } });
  } catch (err) {
    log.error("word:share", `couldn't post the grid in ${i.channelId}`, err);
  }
}

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
      refusalText(result.reason, { ...puzzle, number: puzzleNumber(puzzle.date), wait }),
    );
  }

  const award = result.kind === "finished" ? result.award : null;
  await reply(i, gameText({ puzzle, game: result.game, award, now, timeZone }));

  if (result.kind === "finished") await share(i, puzzle, result.game);
}
