import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { isAbandoned, jevosToMove, outcomeOf, startGame } from "../game.ts";
import { jevosTurn } from "../jevos.ts";
import { renderGame } from "../render.ts";
import { abandon, gameLink } from "../settle.ts";
import { GameStore } from "../store/games.ts";
import { startThinking, stopThinking } from "../thinking.ts";
import type { GameView, PlayDeps } from "../types.ts";
import { data } from "./data.ts";

/** A fresh game's first view; jevos moves first when the coin says so. */
async function opening(i: ChatInputCommandInteraction, d: PlayDeps): Promise<GameView> {
  const game = startGame({
    guildId: i.guildId ?? "",
    channelId: i.channelId,
    playerId: i.user.id,
    now: Date.now(),
    random: d.random,
  });

  if (!jevosToMove(game)) return { game, outcome: outcomeOf(game), thinking: false, last: null };

  const { moved, last } = await jevosTurn(d.jev, game, d.random, Date.now());

  return { ...moved, thinking: false, last };
}

/** Sends the board and stores the game with its message. */
async function begin(i: ChatInputCommandInteraction, store: GameStore, d: PlayDeps) {
  await i.deferReply();
  const view = await opening(i, d);
  const message = await i.editReply({ ...renderGame(view), allowedMentions: { parse: [] } });
  store.put({ ...view.game, messageId: message.id });
}

export function tictactoeCommand(d: PlayDeps): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const guildId = i.guildId;

    if (!guildId) return reply(i, "Use this in a server.");

    const store = new GameStore(ctx.db);
    const live = store.get(guildId);

    if (live && !isAbandoned(live, Date.now())) return reply(i, `A game is on: ${gameLink(live)}`);

    if (!startThinking(guildId)) return reply(i, "A game is already starting.");

    try {
      if (live) await abandon(ctx.client, store, live);

      await begin(i, store, d);
    } finally {
      stopThinking(guildId);
    }
  }

  return { data, execute };
}
