import { type FetchFn, isRecord } from "./guards.ts";

export class JevError extends Error {
  override name = "JevError";
}

export interface JevQuestion {
  key: string;
  instructions: string;
}

const MAX_STATE = 1_500;
const TIMEOUT_MS = 10_000;

/**
 * Asks jev's model (jevos on llama.cpp's server) each question about `state`, one after another:
 * question key → P(yes). The prompt and the reading of P(token "1") are jev's own; `cache_prompt`
 * lets the server reuse the shared evidence prefix. Any failure is a JevError.
 */
export async function postYesNo(
  url: string,
  state: string,
  questions: JevQuestion[],
  fetchFn: FetchFn,
): Promise<Map<string, number>> {
  const evidence = `<evidence>
${state.slice(0, MAX_STATE)}
</evidence>`;
  const out = new Map<string, number>();
  for (const { key, instructions } of questions) {
    out.set(
      key,
      await askOne(
        url,
        `${evidence}

Question: ${instructions}
Answer:`,
        fetchFn,
      ),
    );
  }
  return out;
}

async function askOne(url: string, prompt: string, fetchFn: FetchFn): Promise<number> {
  let res: Response;
  try {
    res = await fetchFn(`${url}/completion`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prompt,
        n_predict: 1,
        grammar: "root ::= [01]",
        temperature: 1,
        top_k: 0,
        top_p: 1,
        min_p: 0,
        n_probs: 2,
        post_sampling_probs: true,
        cache_prompt: true,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new JevError(`jev unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) throw new JevError(`jev returned ${res.status}`);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new JevError("jev returned invalid JSON");
  }
  const steps = isRecord(body) ? body["completion_probabilities"] : undefined;
  const first: unknown = Array.isArray(steps) ? steps[0] : undefined;
  const top = isRecord(first) ? first["top_probs"] : undefined;
  if (!Array.isArray(top)) throw new JevError("jev returned no probabilities");
  const yes: unknown = top.find((t: unknown) => isRecord(t) && t["token"] === "1");
  const p = isRecord(yes) ? yes["prob"] : 0;
  if (typeof p !== "number" || p < 0 || p > 1) throw new JevError("jev returned a bad probability");
  return p;
}
