/** Discord's "typing…" lasts about 10 s; local replies can take longer, so it is re-sent. */
export const TYPING_EVERY_MS = 8_000;

/** Sends typing now and every `everyMs` until the returned stop is called; failures are ignored. */
export function keepTyping(send: () => Promise<unknown>, everyMs = TYPING_EVERY_MS): () => void {
  const once = () => void send().catch(() => undefined);
  once();
  const timer = setInterval(once, everyMs);

  return () => clearInterval(timer);
}
