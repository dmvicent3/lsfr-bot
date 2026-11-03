import { reply } from "../../../core/replies.ts";
import { startThinking, stopThinking } from "../../four/thinking.ts";
import { startGame } from "../game.ts";
import { boardMessage } from "../board-message.ts";
import { markOld } from "../settle.ts";
import type { Difficulty } from "../types.ts";
import { replaceOld } from "./replace.ts";
import type { CommandCtx } from "./types.ts";

const LEVELS: readonly string[] = ["easy", "normal", "hard"] satisfies Difficulty[];

const isLevel = (s: string): s is Difficulty => LEVELS.includes(s);

const levelOf = (s: string | null): Difficulty => (s && isLevel(s) ? s : "normal");

/** The player's lock key; shares four's per-process lock set under its own prefix. */
export const fleetKey = (guildId: string, playerId: string): string =>
  `fleet:${guildId}:${playerId}`;

/** Sends the placing board (the reply is already deferred) and stores the game with its message. */
async function begin({ i, guildId, repo, d }: CommandCtx): Promise<void> {
  const game = startGame({
    guildId,
    channelId: i.channelId,
    playerId: i.user.id,
    difficulty: levelOf(i.options.getString("difficulty")),
    now: Date.now(),
    random: d.random,
  });
  const view = { game, outcome: { kind: "playing" }, aiming: false } as const;
  const message = await i.editReply({ ...boardMessage(view), allowedMentions: { parse: [] } });
  repo.games.put({ ...game, messageId: message.id });
}

/** `/fleet play`: gives up the player's live game (see replaceOld), then starts a new one. */
export async function play(c: CommandCtx): Promise<void> {
  const key = fleetKey(c.guildId, c.i.user.id);

  if (!startThinking(key)) return reply(c.i, "jevos is still aiming on your last game.");

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
