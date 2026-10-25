import type { JevQuestion } from "./types.ts";
import { isRecord } from "../guards.ts";
import type { FetchFn } from "../types.ts";

export class JevError extends Error {
  override name = "JevError";
}

const MAX_STATE = 1_500;
const TIMEOUT_MS = 10_000;
/** jev's sampling: one token, forced to "0" or "1", read as P("1"). */
const SAMPLING = {
  n_predict: 1,
  grammar: "root ::= [01]",
  temperature: 1,
  top_k: 0,
  top_p: 1,
  min_p: 0,
  n_probs: 2,
  post_sampling_probs: true,
  cache_prompt: true,
};

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err));

async function complete(url: string, prompt: string, fetchFn: FetchFn): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(`${url}/completion`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, ...SAMPLING }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new JevError(`jev unreachable: ${message(err)}`);
  }
  if (!res.ok) throw new JevError(`jev returned ${res.status}`);
  return res.json().catch(() => {
    throw new JevError("jev returned invalid JSON");
  });
}

/** P(token "1") from llama.cpp's completion_probabilities; 0 when "1" isn't among them. */
function yesProbability(body: unknown): number {
  const steps = isRecord(body) ? body["completion_probabilities"] : undefined;
  const first: unknown = Array.isArray(steps) ? steps[0] : undefined;
  const top = isRecord(first) ? first["top_probs"] : undefined;
  if (!Array.isArray(top)) throw new JevError("jev returned no probabilities");
  const yes: unknown = top.find((t: unknown) => isRecord(t) && t["token"] === "1");
  const p = isRecord(yes) ? yes["prob"] : 0;
  if (typeof p !== "number" || p < 0 || p > 1) throw new JevError("jev returned a bad probability");
  return p;
}

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
  const evidence = `<evidence>\n${state.slice(0, MAX_STATE)}\n</evidence>`;
  const out = new Map<string, number>();
  for (const { key, instructions } of questions) {
    const prompt = `${evidence}\n\nQuestion: ${instructions}\nAnswer:`;
    out.set(key, yesProbability(await complete(url, prompt, fetchFn)));
  }
  return out;
}
