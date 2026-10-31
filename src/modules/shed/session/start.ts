import { log } from "../../../core/log.ts";
import type { Ctx } from "../../../core/types.ts";
import { discordPoster } from "../../trivia/session/poster.ts";
import { ShedRepo } from "../store/repo.ts";
import { register, unregister } from "./registry.ts";
import { Runner } from "./runner.ts";

const TICK_MS = 1_000;

interface StartParams {
  guildId: string;
  channelId: string;
  userId: string;
  name: string;
  stacking: boolean;
  now: number;
}

const tickEvery = (runner: Runner): ReturnType<typeof setInterval> =>
  setInterval(() => {
    runner.tick(Date.now()).catch((err: unknown) => log.error("shed", "tick failed", err));
  }, TICK_MS);

/** Opens a lobby in a channel and its one-second tick; "busy" when a game is already live there. */
export async function startShed(
  ctx: Ctx,
  p: StartParams,
  random: () => number,
): Promise<"started" | "busy"> {
  const repo = new ShedRepo(ctx.db);
  const gameId = repo.games.start({ ...p, startedBy: p.userId, at: p.now });

  if (gameId === null) return "busy";

  let timer: ReturnType<typeof setInterval> | undefined;
  const starter = { userId: p.userId, name: p.name };
  const runner = new Runner(
    { ...p, gameId, starter },
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
  await runner.open(p.now);
  timer = tickEvery(runner);

  return "started";
}
