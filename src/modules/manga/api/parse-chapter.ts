import { asText, isRecord } from "../../../core/guards.ts";
import { related, relatedAttributes, textOrNull } from "./relations.ts";
import type { Chapter } from "./types.ts";

/** A chapter; null without an id, attributes, manga or readable time. */
export function parseChapter(r: Record<string, unknown>): Chapter | null {
  const id = asText(r["id"]);
  const attributes = r["attributes"];
  const mangaId = asText(related(r, "manga")?.["id"]);

  if (!id || !isRecord(attributes) || !mangaId) return null;

  const readableAt = asText(attributes["readableAt"]);

  if (!readableAt) return null;

  return {
    id,
    mangaId,
    number: textOrNull(attributes["chapter"]),
    title: textOrNull(attributes["title"]),
    group: textOrNull(relatedAttributes(r, "scanlation_group")["name"]),
    externalUrl: textOrNull(attributes["externalUrl"]),
    readableAt,
  };
}
