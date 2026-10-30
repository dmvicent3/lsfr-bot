import { log } from "../../../core/log.ts";
import type { Ctx } from "../../../core/types.ts";
import { kaosLists, questions } from "../data/load.ts";
import { TriviaRepo } from "../store/repo.ts";
import { discordPoster } from "./poster.ts";
import { register, unregister } from "./registry.ts";
import { Runner } from "./runner.ts";

const TICK_MS = 1_000;

/** Starts a session in a channel and its one-second tick; "busy" when one is already live there. */
export function startSession(
  ctx: Ctx,
  p: { guildId: string; channelId: string; userId: string; now: number },
  random: () => number,
): "started" | "busy" {
  const repo = new TriviaRepo(ctx.db);
  const sessionId = repo.sessions.start({ ...p, startedBy: p.userId, at: p.now });

  if (sessionId === null) return "busy";

  let timer: ReturnType<typeof setInterval> | undefined;
  const runner = new Runner(
    { sessionId, guildId: p.guildId, channelId: p.channelId, now: p.now },
    {
      repo,
      poster: discordPoster(ctx.client, p.channelId),
      random,
      questions: questions(),
      lists: kaosLists(),
      onEnd: () => {
        clearInterval(timer);
        unregister(p.channelId, runner);
      },
    },
  );
  register(p.channelId, runner);
  timer = setInterval(() => {
    runner.tick(Date.now()).catch((err: unknown) => log.error("trivia", "tick failed", err));
  }, TICK_MS);

  return "started";
}
