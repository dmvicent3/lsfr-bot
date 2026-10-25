import type { FetchFn } from "../types.ts";

export interface JevQuestion {
  key: string;
  instructions: string;
}

export interface Jev {
  yesNo(state: string, questions: JevQuestion[]): Promise<Map<string, number>>;
}

export interface JevOptions {
  url: string;
  fetchFn?: FetchFn;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}
