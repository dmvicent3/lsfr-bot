import type { ParsedSession } from "../types.ts";

export async function fixture(name: string): Promise<unknown> {
  return Bun.file(new URL(`./fixtures/${name}.json`, import.meta.url)).json();
}

export function find(
  sessions: readonly ParsedSession[],
  eventId: string,
  sessionId: string,
): ParsedSession {
  const match = sessions.find((s) => s.eventId === eventId && s.sessionId === sessionId);
  if (!match) throw new Error(`no session ${eventId}/${sessionId}`);
  return match;
}
