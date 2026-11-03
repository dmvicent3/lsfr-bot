export type ClueEntry = { word: string; def: string };

/** The single prompt asking for one short crossword clue per listed answer. */
export function cluePrompt(entries: ClueEntry[]): string {
  const lines = entries.map((e) => `${e.word}: ${e.def}`).join("\n");

  return [
    "Write a short crossword clue for each answer below, using its definition as a guide.",
    "Each clue must be under 90 characters and must not contain the answer word or any form of it.",
    'Reply with only a JSON object mapping each uppercase answer to its clue, like {"WORD":"clue"}.',
    "Include exactly one entry for every listed answer.",
    "",
    lines,
  ].join("\n");
}
