import { log } from "../../../core/log.ts";
import type { Ctx } from "../../../core/types.ts";
import { discordPoster } from "../../trivia/session/poster.ts";
import { starterDeck } from "../data/load.ts";
import { CardsRepo } from "../store/repo.ts";
import type { Deck } from "../types.ts";
import { register, unregister } from "./registry.ts";
import { Runner } from "./runner.ts";

const TICK_MS = 1_000;

interface StartParams {
  guildId: string;
  channelId: string;
  userId: string;
  name: string;
  target: number;
  now: number;
}

/** The starter deck plus the server's own cards. */
function deckFor(repo: CardsRepo, guildId: string): Deck {
  const starter = starterDeck();
  const custom = repo.custom.live(guildId);

  return {
    prompts: [...starter.prompts, ...custom.prompts],
    answers: [...starter.answers, ...custom.answers],
  };
}

const tickEvery = (runner: Runner): ReturnType<typeof setInterval> =>
  setInterval(() => {
    runner.tick(Date.now()).catch((err: unknown) => log.error("cards", "tick failed", err));
  }, TICK_MS);

/** Opens a lobby in a channel and its one-second tick; "busy" when a game is already live there. */
export async function startCards(
  ctx: Ctx,
  p: StartParams,
  random: () => number,
): Promise<"started" | "busy"> {
  const repo = new CardsRepo(ctx.db);
  const gameId = repo.games.start({ ...p, startedBy: p.userId, at: p.now });

  if (gameId === null) return "busy";

  let timer: ReturnType<typeof setInterval> | undefined;
  const starter = { userId: p.userId, name: p.name };
  const runner = new Runner(
    { ...p, gameId, starter, deck: deckFor(repo, p.guildId) },
    {
      repo,
      poster: discordPoster(ctx.client, p.channelId),
      random,
      onEnd: () => {
        clearInterval(timer);
        unregister(p.channelId, runner);
      },
    },
  );
  register(p.channelId, runner);
  await runner.open();
  timer = tickEvery(runner);

  return "started";
}
