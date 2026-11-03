/** A clickable command mention when the ID is known, plain code otherwise. */
export function commandMention(path: string, id: string | undefined): string {
  return id ? `</${path}:${id}>` : `\`/${path}\``;
}

/** The mention of a command path ("sudoku daily") from the registered top-level command IDs. */
export const mentionOf = (path: string, commandIds: ReadonlyMap<string, string>): string =>
  commandMention(path, commandIds.get(path.split(" ")[0] ?? path));
