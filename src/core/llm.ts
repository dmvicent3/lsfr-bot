import { type FetchFn, isRecord, isString } from "./guards.ts";

export class LlmError extends Error {
  override name = "LlmError";
}

function responseText(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body["candidates"])) return "";
  const first: unknown = body["candidates"][0];
  if (!isRecord(first) || !isRecord(first["content"])) return "";
  const parts = first["content"]["parts"];
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part: unknown) => (isRecord(part) && isString(part["text"]) ? part["text"] : ""))
    .join("");
}

export interface Turn {
  role: "user" | "model";
  text: string;
}

/** One prompt, or a whole conversation (oldest first, ending with the user's turn). */
export async function generate(
  prompt: string | Turn[],
  opts: { apiKey: string; model: string; fetchFn?: FetchFn },
): Promise<string> {
  const turns: Turn[] = typeof prompt === "string" ? [{ role: "user", text: prompt }] : prompt;
  const fetchFn = opts.fetchFn ?? fetch;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": opts.apiKey },
    body: JSON.stringify({
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new LlmError(`Gemini returned ${res.status}: ${await res.text()}`);
  }
  const text = responseText(await res.json());
  if (!text) throw new LlmError("Gemini returned no text");
  return text;
}
