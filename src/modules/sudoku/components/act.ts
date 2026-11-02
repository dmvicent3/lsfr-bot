import { type MessageComponentInteraction, MessageFlags } from "discord.js";
import { finish } from "../play/finish.ts";
import { unchanged } from "../play/step.ts";
import { view } from "../render/view.ts";
import type { SudokuRepo } from "../store/repo.ts";
import type { Award, Game, Step } from "../types.ts";
import { announce } from "./announce.ts";
import { STALE, tell } from "./guard.ts";
import { parseKey } from "./key.ts";

/** Stores the step; the award is set when this click solved a daily. */
function land(repo: SudokuRepo, step: Step, now: number): { game: Game; award: Award | null } {
  if (step.solved) return finish(repo, step.game, now);

  const saved = repo.games.save(step.game);

  return { game: saved ? step.game : (repo.games.get(step.game) ?? step.game), award: null };
}

/**
 * Plays one click on the clicker's own board: read, move and save run with no await in between,
 * so two quick clicks never interleave. Another user's click finds their own key, never the owner's.
 */
export async function act(
  i: MessageComponentInteraction,
  repo: SudokuRepo,
  keyArgs: string[],
  apply: (game: Game) => Step,
): Promise<void> {
  const now = Date.now();
  const key = i.guildId ? parseKey(keyArgs, i.user.id, i.guildId) : null;
  const game = key && repo.games.get(key);

  if (!game) return tell(i, STALE);

  const step = game.solvedAt === null ? apply(game) : unchanged(game);

  if (step.game === game && step.note) return tell(i, step.note);

  if (step.game === game) return void (await i.update(view(game, now)));

  await reply(i, step, land(repo, step, now), now);
}

/** Shows the landed step, adds its note, and announces a solved daily. */
async function reply(
  i: MessageComponentInteraction,
  step: Step,
  { game: after, award }: { game: Game; award: Award | null },
  now: number,
): Promise<void> {
  await i.update(view(after, now, award));

  if (step.note) await i.followUp({ content: step.note, flags: MessageFlags.Ephemeral });

  if (award && after.kind === "daily") await announce(i, after);
}
