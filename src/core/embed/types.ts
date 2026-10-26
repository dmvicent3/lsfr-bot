import type { FetchFn } from "../types.ts";

export interface Embedder {
  /** The text's embedding, L2-normalized. */
  embed(text: string): Promise<Float32Array>;
}

export interface EmbedderOptions {
  url: string;
  fetchFn?: FetchFn;
}
