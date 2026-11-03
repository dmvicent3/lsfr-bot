/** Where a player is with one daily today. */
export type DailyState = "done" | "started" | "todo";

/** What a line needs before the game is looked at: its name, how to play it, its time zone. */
export interface EntryBase {
  /** "Sudoku easy #1" */
  label: string;
  /** The play command's path, "sudoku daily". */
  command: string;
  tz: string;
}

/** One line of the checklist. */
export interface DailyEntry extends EntryBase {
  state: DailyState;
  /** The finished game's outcome ("130 pts", "gave up"); null until done. */
  result: string | null;
}

/** The player whose dailies are listed. */
export interface Who {
  guildId: string;
  userId: string;
}
