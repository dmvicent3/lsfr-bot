import type { Turn } from "../../core/types.ts";

const PREFIX = /^([^:\n]{1,40}): /gm;

/** The names people's lines start with in the chain ("12x: …"). */
function namesIn(turns: Turn[]): string[] {
  return turns
    .filter((t) => t.role === "user")
    .flatMap((t) => [...t.text.matchAll(PREFIX)].map((m) => m[1] ?? ""))
    .filter((name) => name !== "");
}

/** A reply without a leading "name: " copied from the chain (the model imitates the format). */
export function withoutEcho(reply: string, turns: Turn[]): string {
  const name = namesIn(turns).find((n) => reply.startsWith(`${n}: `));

  return name === undefined ? reply : reply.slice(name.length + 2);
}
