import type { SeriesKey } from "../../types.ts";

export interface Named {
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface EventCtx {
  series: SeriesKey;
  year: number;
  event: Named;
}
