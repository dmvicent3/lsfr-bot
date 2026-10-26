import type { Chapter } from "../api/types.ts";

/** What a series has already posted: the highest chapter number, and oneshot ids. */
export interface Seen {
  highest: number | null;
  unnumbered: Set<string>;
}

/** One message's chapters, and what to store once it is sent. */
export interface Post {
  /** Ascending; more than one only when a bulk upload was collapsed. */
  chapters: Chapter[];
  highest: number | null;
  unnumberedId: string | null;
}
