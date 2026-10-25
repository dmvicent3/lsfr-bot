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

/** One yes/no request to jev (`POST /v1/systemone`): question key → P(yes). Any failure is a JevError. */
export async function postYesNo(
  url: string,
  state: string,
  questions: JevQuestion[],
  fetchFn: FetchFn,
): Promise<Map<string, number>> {
  let res: Response;
  try {
    res = await fetchFn(`${url}/v1/systemone`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "jev-latest",
        state: state.slice(0, MAX_STATE),
        questions: Object.fromEntries(
          questions.map((q) => [q.key, { type: "noul", instructions: q.instructions }]),
        ),
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
  const answers = isRecord(body) ? body["answers"] : undefined;
  if (!isRecord(answers)) throw new JevError("jev returned no answers");
  const out = new Map<string, number>();
  for (const { key } of questions) {
    const answer = answers[key];
    const p = isRecord(answer) ? answer["noul"] : undefined;
    if (typeof p !== "number" || p < 0 || p > 1)
      throw new JevError(`jev gave no answer for ${key}`);
    out.set(key, p);
  }
  return out;
}
