import { asText, isRecord, records } from "../../../core/guards.ts";
import { relatedAttributes, textOrNull } from "./relations.ts";
import type { MangaInfo } from "./types.ts";

/** First English alt title, else title.en, else romaji, else any title (as the old script). */
function mangaTitle(attributes: Record<string, unknown>): string {
  const alt = records(attributes["altTitles"]).find((t) => asText(t["en"]) !== "");

  if (alt) return asText(alt["en"]);

  const title = isRecord(attributes["title"]) ? attributes["title"] : {};

  return asText(title["en"]) || asText(title["ja-ro"]) || asText(Object.values(title)[0]);
}

export function parseManga(r: Record<string, unknown>): MangaInfo | null {
  const id = asText(r["id"]);
  const attributes = r["attributes"];

  if (!id || !isRecord(attributes)) return null;

  return {
    id,
    title: mangaTitle(attributes),
    latestUpload: textOrNull(attributes["latestUploadedChapter"]),
    coverFile: textOrNull(relatedAttributes(r, "cover_art")["fileName"]),
    author: textOrNull(relatedAttributes(r, "author")["name"]),
  };
}
