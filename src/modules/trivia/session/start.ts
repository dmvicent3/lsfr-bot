import { log } from "../../../core/log.ts";
import type { Ctx } from "../../../core/types.ts";
import { kaosLists, pictures, questions } from "../data/load.ts";
import { TriviaRepo } from "../store/repo.ts";
import { downloadPicture } from "./image.ts";
import { discordPoster } from "./poster.ts";
import { register, unregister } from "./registry.ts";
import { Runner } from "./runner.ts";
import type { Deps } from "./types.ts";

const TICK_MS = 1_000;

/** The bundled questions, lists and pictures, where picture images come from, and the clock. */
const bank = (): Pick<Deps, "questions" | "lists" | "pictures" | "fetchImage" | "now"> => ({
  questions: questions(),
  lists: kaosLists(),
  pictures: pictures(),
  fetchImage: (file) => downloadPicture(file, fetch),
  now: Date.now,
});

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
      ...bank(),
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
