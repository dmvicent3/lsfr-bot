/** EmbeddingGemma 2's prompt for comparing two texts. */
const PREFIX = "task: sentence similarity | query: ";
/** Google News titles end in " - <publisher>". */
const PUBLISHER = /\s+-\s+[^-]+$/;

function isGoogleNews(feedUrl: string): boolean {
  try {
    return new URL(feedUrl).hostname === "news.google.com";
  } catch {
    return false;
  }
}

/** The text an article is compared by: its title; null when there is none to compare. */
export function storyText(title: string, feedUrl: string): string | null {
  const story = (isGoogleNews(feedUrl) ? title.replace(PUBLISHER, "") : title).trim();

  return story ? PREFIX + story : null;
}
