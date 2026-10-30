/** Posted when a KAOS round closes: claims per player, then what nobody found. */
export function kaosSummary(scorers: { name: string; items: number }[], missed: string[]): string {
  const who =
    scorers.length > 0 ? scorers.map((s) => `${s.name} ${s.items}`).join(", ") : "nobody scored";
  const tail = missed.length > 0 ? `Missed: ${missed.join(", ")}` : "All found!";

  return `KAOS over — ${who}. ${tail}`;
}

/** Posted when a session ends: how long it ran and its top three. */
export function sessionSummary(rounds: number, top: { name: string; points: number }[]): string {
  const head = `Trivia over after ${rounds} rounds.`;

  if (top.length === 0) return `${head} Nobody scored.`;

  return `${head} Top: ${top.map((t, i) => `${i + 1}. ${t.name} ${t.points}`).join(" · ")}`;
}
