import type { Preset, Setup, SetupOptions } from "./types.ts";

export const MIN_SIDE = 5;

export const MAX_SIDE = 20;

export const PRESETS: Record<Preset, Setup> = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 20, height: 20, mines: 80 },
};

/** The first reveal and its 8 neighbours always stay clear. */
export const maxMines = (width: number, height: number): number => width * height - 9;

/** Mines for a resized board at the preset's density, within 1 … maxMines. */
function scaledMines(preset: Setup, width: number, height: number): number {
  const cells = width * height;
  const scaled = Math.round((cells * preset.mines) / (preset.width * preset.height));

  return Math.min(Math.max(scaled, 1), maxMines(width, height));
}

/** The board a /minesweeper play asks for: preset, then each given value over it. */
export function resolveSetup(o: SetupOptions): Setup | { refusal: string } {
  const preset = PRESETS[o.difficulty ?? "beginner"];
  const width = o.width ?? preset.width;
  const height = o.height ?? preset.height;
  const resized = width !== preset.width || height !== preset.height;
  const max = maxMines(width, height);

  if (o.mines !== null && o.mines > max) {
    return { refusal: `Too many mines: a ${width}×${height} board takes at most ${max}.` };
  }

  const mines = o.mines ?? (resized ? scaledMines(preset, width, height) : preset.mines);

  return { width, height, mines };
}
