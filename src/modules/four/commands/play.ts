import { reply } from "../../../core/replies.ts";
import { jevosToMove, outcomeOf, startGame } from "../game.ts";
import { jevosTurn } from "../jevos.ts";
import { renderGame } from "../render/board.ts";
import { markOld } from "../settle.ts";
import { startThinking, stopThinking, thinkKey } from "../thinking.ts";
import type { Difficulty, GameView } from "../types.ts";
import { replaceOld } from "./replace.ts";
import type { CommandCtx } from "./types.ts";

const LEVELS: readonly string[] = ["easy", "normal", "hard"] satisfies Difficulty[];

const isLevel = (s: string): s is Difficulty => LEVELS.includes(s);

const levelOf = (s: string | null): Difficulty => (s && isLevel(s) ? s : "normal");

/** A fresh game's first view; jevos drops first when the coin says so. */
async function opening({ i, guildId, d }: CommandCtx): Promise<GameView> {
  const game = startGame({
    guildId,
    channelId: i.channelId,
    playerId: i.user.id,
    difficulty: levelOf(i.options.getString("difficulty")),
    now: Date.now(),
    random: d.random,
  });

  if (!jevosToMove(game)) return { game, outcome: outcomeOf(game), thinking: false, last: null };

  const { moved, last } = await jevosTurn(d.jev, game, d.random, Date.now());

  return { ...moved, thinking: false, last };
}

/** Sends the board (the reply is already deferred) and stores the game with its message. */
async function begin(c: CommandCtx): Promise<void> {
  const view = await opening(c);
  const message = await c.i.editReply({ ...renderGame(view), allowedMentions: { parse: [] } });
  c.repo.games.put({ ...view.game, messageId: message.id });
}

/** `/four play`: gives up the player's live game (see replaceOld), then starts a new one. */
export async function play(c: CommandCtx): Promise<void> {
  const key = thinkKey(c.guildId, c.i.user.id);

  if (!startThinking(key)) return reply(c.i, "jevos is still thinking on your last game.");

  try {
    // Acknowledged first: the old board's edit is a network call and Discord allows 3 s.
    await c.i.deferReply();
    const old = c.repo.games.get(c.guildId, c.i.user.id);

    if (old) {
      replaceOld(c.repo, old, Date.now());
      await markOld(c.ctx.client, old);
    }

    await begin(c);
  } finally {
    stopThinking(key);
  }
}
