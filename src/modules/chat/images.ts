import type { ImageRef } from "./types.ts";
import type { FetchFn } from "../../core/types.ts";
import type { InlineImage } from "../../core/types.ts";

export const MAX_IMAGES = 4;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** What Gemini reads inline. GIFs aren't among them. */
const SUPPORTED = new Set(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"]);

const isImage = (r: ImageRef): boolean => r.contentType?.startsWith("image/") ?? false;
const mimeOf = (r: ImageRef): string => r.contentType?.split(";")[0]?.trim() ?? "";

/**
 * Picks the images to send from each chain message's attachments (oldest message first):
 * the newest first, up to MAX_IMAGES. `skipped` counts images left out (over the cap, too
 * big, or an unsupported type); other attachments aren't images and don't count.
 */
export function selectImages(chain: ImageRef[][]): { chosen: ImageRef[]; skipped: number } {
  const chosen: ImageRef[] = [];
  let skipped = 0;

  for (const refs of chain.toReversed()) {
    for (const ref of refs.filter(isImage)) {
      const fits = SUPPORTED.has(mimeOf(ref)) && ref.size <= MAX_IMAGE_BYTES;

      if (fits && chosen.length < MAX_IMAGES) chosen.push(ref);
      else skipped++;
    }
  }

  return { chosen, skipped };
}

/** Each image as base64, or null when it couldn't be downloaded (or turned out too big). */
export async function downloadImages(
  refs: ImageRef[],
  fetchFn: FetchFn,
): Promise<(InlineImage | null)[]> {
  return Promise.all(
    refs.map(async (ref) => {
      try {
        const res = await fetchFn(ref.url, { signal: AbortSignal.timeout(20_000) });

        if (!res.ok) return null;

        const bytes = await res.arrayBuffer();

        if (bytes.byteLength > MAX_IMAGE_BYTES) return null;

        return { mimeType: mimeOf(ref), data: Buffer.from(bytes).toString("base64") };
      } catch {
        return null;
      }
    }),
  );
}

const images = (n: number): string => `${n} image${n === 1 ? "" : "s"}`;

/** Small print under the answer about images Gork didn't look at. */
export function imageNotes(skipped: number, failed: number): string {
  const notes = [
    ...(skipped > 0
      ? [`Skipped ${images(skipped)} (max ${MAX_IMAGES} per message, 10 MB each, no GIFs).`]
      : []),
    ...(failed > 0 ? [`Couldn't load ${images(failed)}, answered without it.`] : []),
  ];

  return notes.map((n) => `\n-# ${n}`).join("");
}
