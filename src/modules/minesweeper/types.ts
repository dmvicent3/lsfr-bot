export type CellState = "hidden" | "open" | "flag";

export type Result = "won" | "lost" | "gave-up";

export type Preset = "beginner" | "intermediate" | "expert";

export type Axis = "col" | "row";

export interface Setup {
  width: number;
  height: number;
  mines: number;
}

/** What the rules and the grid render need. field: true = mine; null until the first reveal. */
export interface Board extends Setup {
  field: boolean[] | null;
  cells: CellState[];
  cursor: number;
  hit: number | null;
  result: Result | null;
}

export interface Game extends Board {
  id: number;
  guildId: string;
  channelId: string;
  messageId: string | null;
  playerId: string;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export type NewGame = Omit<Game, "id">;

/** The /minesweeper play options; null = not given. */
export interface SetupOptions {
  difficulty: Preset | null;
  width: number | null;
  height: number | null;
  mines: number | null;
}

/** A reveal's outcome; a hint means nothing changed. */
export interface RevealStep {
  cells: CellState[];
  hit: number | null;
  hint: string | null;
}
