/** Wordings that only make sense with the options in view. */
const NEEDS_OPTIONS =
  /which of these|which of the following|which one of|what of the following|\bnot\b/i;

const MAX_TYPED_ANSWER = 30;

/** Whether a question can be answered by typing, or only by picking from its options. */
export function classify(q: {
  type: "boolean" | "multiple";
  question: string;
  answer: string;
}): "typed" | "choice" {
  const typed =
    q.type === "multiple" &&
    !NEEDS_OPTIONS.test(q.question) &&
    q.answer.length <= MAX_TYPED_ANSWER &&
    /\p{L}/u.test(q.answer) &&
    !/[/()]/.test(q.answer);

  return typed ? "typed" : "choice";
}
