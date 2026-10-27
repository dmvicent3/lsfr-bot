import type { FetchFn } from "../types.ts";

export interface JevQuestion {
  key: string;
  instructions: string;
}

export interface YesNoOptions {
  /** Characters of state kept; the rest is cut. Default 1,500. */
  maxState?: number;
}

export interface Jev {
  yesNo(state: string, questions: JevQuestion[], opts?: YesNoOptions): Promise<Map<string, number>>;
}

export interface JevOptions {
  url: string;
  fetchFn?: FetchFn;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}
