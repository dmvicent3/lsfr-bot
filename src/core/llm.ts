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

export async function generate(
  prompt: string,
  opts: { apiKey: string; model: string; fetchFn?: FetchFn },
): Promise<string> {
  const fetchFn = opts.fetchFn ?? fetch;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": opts.apiKey },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new LlmError(`Gemini returned ${res.status}: ${await res.text()}`);
  }
  const text = responseText(await res.json());
  if (!text) throw new LlmError("Gemini returned no text");
  return text;
}
