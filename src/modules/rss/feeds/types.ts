export type Lookup = (host: string) => Promise<string[]>;

export interface FeedItem {
  title: string;
  link: string | null;
  guid: string | null;
  /** Plain text: tags stripped, entities decoded, whitespace collapsed. */
  description: string;
  publishedAt: number | null;
  image: string | null;
}

export interface ParsedFeed {
  title: string;
  items: FeedItem[];
}
