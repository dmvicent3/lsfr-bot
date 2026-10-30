import { log } from "../../../core/log.ts";
import type { FetchFn } from "../../../core/types.ts";

export interface PictureFile {
  data: Buffer;
  name: string;
}

const THUMB = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const HEADERS = { "User-Agent": "GorkTriviaBuilder/1.0 (Gork Discord bot)" };
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 8 * 1024 * 1024;
/** Commons serves SVGs as PNG thumbnails, photos as JPEG, animations as GIF. */
const NAMES: Record<string, string> = {
  "image/png": "picture.png",
  "image/jpeg": "picture.jpg",
  "image/gif": "picture.gif",
};

/** A 640px Commons thumbnail, or null when it is slow, too big, not an image or missing. */
export async function downloadPicture(file: string, fetchFn: FetchFn): Promise<PictureFile | null> {
  try {
    const res = await fetchFn(`${THUMB}${encodeURIComponent(file)}?width=640`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const name = NAMES[res.headers.get("content-type")?.split(";")[0] ?? ""];

    if (!res.ok || name === undefined) return null;

    const data = Buffer.from(await res.arrayBuffer());

    return data.length > MAX_BYTES ? null : { data, name };
  } catch (err) {
    log.error("trivia", `could not download ${file}`, err);

    return null;
  }
}
