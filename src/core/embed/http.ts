import type { Embedder, EmbedderOptions } from "./types.ts";
import { isRecord } from "../guards.ts";
import type { FetchFn } from "../types.ts";

export class EmbedError extends Error {
  override name = "EmbedError";
}

const TIMEOUT_MS = 10_000;

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err));

async function request(url: string, text: string, fetchFn: FetchFn): Promise<unknown> {
  let res: Response;

  try {
    res = await fetchFn(`${url}/embedding`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new EmbedError(`embed unreachable: ${message(err)}`);
  }

  if (!res.ok) throw new EmbedError(`embed returned ${res.status}`);

  return res.json().catch(() => {
    throw new EmbedError("embed returned invalid JSON");
  });
}

const isNumber = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** The first result's vector; llama.cpp nests it one level deeper with pooling on. */
function vectorOf(body: unknown): number[] {
  const first: unknown = Array.isArray(body) ? body[0] : undefined;
  const raw = isRecord(first) ? first["embedding"] : undefined;
  const flat: unknown = Array.isArray(raw) && Array.isArray(raw[0]) ? raw[0] : raw;
  const values: unknown[] = Array.isArray(flat) ? flat : [];

  if (values.length === 0) throw new EmbedError("embed returned no vector");

  if (!values.every(isNumber)) throw new EmbedError("embed returned a non-numeric vector");

  return values;
}

function normalized(v: number[]): Float32Array {
  const norm = Math.hypot(...v);

  if (norm === 0) throw new EmbedError("embed returned a zero vector");

  return Float32Array.from(v, (x) => x / norm);
}

/** Embeddings from a llama.cpp server started with --embeddings. Any failure is an EmbedError. */
export function createEmbedder({ url, fetchFn = fetch }: EmbedderOptions): Embedder {
  return {
    embed: async (text) => normalized(vectorOf(await request(url, text, fetchFn))),
  };
}
