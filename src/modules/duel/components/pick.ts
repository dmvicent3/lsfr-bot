import type { ComponentHandler } from "../../../core/types.ts";
import { answer, isDone } from "../play/answer.ts";
import { finish } from "../play/finish.ts";
import { view } from "../render/view.ts";
import type { Award, Game } from "../types.ts";
import { announce } from "./announce.ts";
import { OUT_OF_DATE, type Session, load, tell } from "./guard.ts";

const stored = (s: Session): Game =>
  s.repo.games.get(s.game.guildId, s.game.date, s.game.userId) ?? s.game;

/** Stores an answered game; the last answer finishes it in the same write. */
function land(s: Session, answered: Game): { game: Game; award: Award | null } {
  if (isDone(s.puzzle, answered)) return finish(s.repo, s.puzzle, answered, s.now);

  return { game: s.repo.games.save(answered) ? answered : stored(s), award: null };
}

/** `duel:pick:<date>:<n>:<a|b>`; the date in the ID is the puzzle, whatever today is. */
export const pickHandler: ComponentHandler = {
  id: "duel:pick",
  async handle(i, args, ctx) {
    const s = load(i, ctx.db, args[0]);

    if (!s) return tell(i, OUT_OF_DATE);

    const pick = args[2] === "a" || args[2] === "b" ? args[2] : null;
    const step = pick && answer(s.puzzle, s.game, Number(args[1]), pick);

    if (!step) return void (await i.update(view(s.puzzle, s.game, { ...s.view, award: s.award })));

    const { game, award } = land(s, step.game);
    await i.update(view(s.puzzle, game, { ...s.view, revealed: true, award }));

    if (award) await announce(i, s.puzzle, game);
  },
};
