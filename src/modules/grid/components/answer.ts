import { MessageFlags } from "discord.js";
import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { missLine, submit } from "../play/answer.ts";
import type { Outcome } from "../play/types.ts";
import { isGame, land } from "../play/round.ts";
import { boardView } from "../render/board-view.ts";
import { gridView } from "../render/view.ts";
import { obscurity } from "../scoring.ts";
import type { Game, Practice } from "../types.ts";
import { announce } from "./announce.ts";
import { cellIndex } from "./ids.ts";
import { OUT_OF_DATE, type Round, type Source, load } from "./guard.ts";

type Rec = Game | Practice;
type Moved = Extract<Outcome, { kind: "hit" | "miss" }>;

/** The record after a guess; a hit adds its points to the running total. */
function applied(rec: Rec, out: Moved): Rec {
  const next = { ...rec, cells: out.cells, guesses: out.guesses };

  if (out.kind === "miss") return { ...next, lastMiss: missLine(out.name, out.reasons) };

  return { ...next, lastMiss: null, points: (rec.points ?? 0) + out.points };
}

function judge(r: Round, cell: number | null, text: string): Outcome {
  if (cell === null || r.rec.finishedAt !== null) return { kind: "stale" };

  const state = { grid: r.grid, cells: r.rec.cells, guesses: r.rec.guesses, finished: false };

  return submit(state, cell, text, { snapshot: r.snap, obscurity: obscurity(r.snap) });
}

/** `grid:answer:<date|practice>:<0-8>`: judges the typed country for a cell. */
export const answerHandler = (source: Source): ModalHandler => ({
  id: "grid:answer",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args[0], source);

    if (!r) return tell(i, OUT_OF_DATE);

    const out = judge(r, cellIndex(args[1]), i.fields.getTextInputValue("country"));

    if (out.kind === "unknown") return tell(i, `Didn't recognise "${out.text}" — no guess used.`);

    if (out.kind === "used") return tell(i, `${out.name} is already on your grid — no guess used.`);

    const { game, award } =
      out.kind === "stale"
        ? { game: r.rec, award: r.award }
        : land(r.repo, applied(r.rec, out), r.now);

    const view = gridView(boardView(r, r.grid, game, award), r.snap);

    if (i.isFromMessage()) await i.update(view);
    else await i.reply({ ...view, flags: MessageFlags.Ephemeral });

    if (award && isGame(game)) await announce(i, game, r.number ?? 0);
  },
});
