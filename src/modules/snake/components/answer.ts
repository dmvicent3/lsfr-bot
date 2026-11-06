import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { acceptedWords } from "../../word/words/load.ts";
import { guess } from "../play/turn.ts";
import { refusalText } from "../play/validate.ts";
import { GUESS_FIELD } from "../render/ids.ts";
import { load, turnOf } from "./guard.ts";
import { present, refresh } from "./show.ts";

/**
 * `snake:answer:<date|practice>:<stamp>`: a guess modal opened before guessing moved to
 * `/snake guess`, still taken so it isn't lost; a refused guess is told privately.
 */
export const answerHandler: ModalHandler = {
  id: "snake:answer",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    const played = guess(turnOf(r), i.fields.getTextInputValue(GUESS_FIELD), acceptedWords);

    if (played.kind === "refused") return tell(i, refusalText(played.reason));

    await present(i, r, played.landed);
  },
};
