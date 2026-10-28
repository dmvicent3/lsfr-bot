/** A random answer this server hasn't had yet; any answer once all have been used. */
export function chooseWord(
  answers: readonly string[],
  used: ReadonlySet<string>,
  random: () => number,
): string {
  const fresh = answers.filter((w) => !used.has(w));
  const pool = fresh.length > 0 ? fresh : answers;

  return pool[Math.floor(random() * pool.length)] ?? "";
}
