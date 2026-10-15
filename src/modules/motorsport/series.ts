import type { SeriesKey } from "./types.ts";

export interface SeriesInfo {
  key: SeriesKey;
  name: string;
  source: "tunous" | "sportstimes";
  /** Folder name in the source repo. */
  path: string;
}

export const SERIES: readonly SeriesInfo[] = [
  { key: "f1", name: "F1", source: "tunous", path: "formula1" },
  { key: "wec", name: "WEC", source: "tunous", path: "wec" },
  { key: "wrc", name: "WRC", source: "tunous", path: "wrc" },
  { key: "indycar", name: "IndyCar", source: "sportstimes", path: "indycar" },
  { key: "motogp", name: "MotoGP", source: "sportstimes", path: "motogp" },
  { key: "fe", name: "Formula E", source: "sportstimes", path: "fe" },
  { key: "f2", name: "F2", source: "sportstimes", path: "f2" },
  { key: "f3", name: "F3", source: "sportstimes", path: "f3" },
];

export function isSeriesKey(s: string): s is SeriesKey {
  return SERIES.some((info) => info.key === s);
}

export function seriesInfo(key: SeriesKey): SeriesInfo {
  const info = SERIES.find((s) => s.key === key);
  if (!info) throw new Error(`Unknown series ${key}`);
  return info;
}
