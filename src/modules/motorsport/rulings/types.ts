import type { FetchFn } from "../../../core/types.ts";
import type { Post } from "../types.ts";

export interface RulingDeps {
  fetchFn: FetchFn;
  /** A PDF's text, laid out (pdftotext -layout). */
  pdfText: (pdf: Uint8Array) => Promise<string>;
  /** Gemini; may throw (down, out of quota), and then the ruling posts without it. */
  summarize: (prompt: string) => Promise<string>;
  post: Post;
}

export interface FiaDocument {
  url: string;
  /** Without the "Doc 61 - " prefix. */
  title: string;
  publishedAt: Date;
}

export interface FiaPage {
  /** The event the listed documents belong to, e.g. "Singapore Grand Prix". */
  event: string | null;
  documents: FiaDocument[];
}

/** A stewards' ruling's labelled fields, whitespace collapsed. */
export interface Ruling {
  car: string;
  driver: string;
  competitor: string;
  session: string;
  fact: string;
  infringement: string;
  decision: string;
  reason: string;
}
