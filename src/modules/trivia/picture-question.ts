import { normalize } from "./match.ts";
import { shuffle } from "./shuffle.ts";
import type { Picture, Question } from "./types.ts";

const WRONG = 3;

/** Three other answers from the picture's category, distinct from it and each other. */
function wrongAnswers(p: Picture, pool: readonly Picture[], random: () => number): string[] {
  const seen = new Set([normalize(p.answer)]);
  const others = pool.filter((o) => o.category === p.category).map((o) => o.answer);

  return shuffle(others, random)
    .filter((a) => !seen.has(normalize(a)) && seen.add(normalize(a)))
    .slice(0, WRONG);
}

/** A picture as an ordinary question; typed only when its category lacks three other answers. */
export function pictureQuestion(
  p: Picture,
  pool: readonly Picture[],
  random: () => number,
): Question {
  const wrong = wrongAnswers(p, pool, random);
  const enough = wrong.length === WRONG;

  return {
    id: p.id,
    category: `Picture: ${p.category}`,
    difficulty: p.difficulty,
    question: p.prompt,
    answer: p.answer,
    wrong: enough ? wrong : [],
    kind: enough ? "choice" : "typed",
    aliases: p.aliases,
    image: p.image,
  };
}
