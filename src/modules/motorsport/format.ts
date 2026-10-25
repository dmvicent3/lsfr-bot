/** Discord's message length limit. */
const MAX_CONTENT = 2000;

/**
 * Rows as monospace lines (one inline code span per row, so the columns line up in
 * Discord). Columns are padded to their widest cell; `right` lists right-aligned columns.
 */
export function formatTable(rows: string[][], right: ReadonlySet<number> = new Set()): string[] {
  const widths: number[] = [];
  for (const row of rows) {
    for (const [i, cell] of row.entries()) widths[i] = Math.max(widths[i] ?? 0, cell.length);
  }
  return rows.map((row) => {
    const cells = row.map((cell, i) =>
      right.has(i) ? cell.padStart(widths[i] ?? 0) : cell.padEnd(widths[i] ?? 0),
    );
    return `\`${cells.join(" ").trimEnd()}\``;
  });
}

/**
 * Heading plus table lines, optionally behind one spoiler, dropping rows from the bottom
 * until it fits in a message.
 */
export function tableMessage(heading: string, lines: string[], spoiler = false): string {
  const wrap = spoiler ? "||" : "";
  const render = (shown: string[]): string => `${heading}\n${wrap}${shown.join("\n")}${wrap}`;
  let shown = lines;
  while (render(shown).length > MAX_CONTENT && shown.length > 0) shown = shown.slice(0, -1);
  return render(shown);
}

/** "1" → "P1"; anything else ("–") as is. */
export const posLabel = (pos: string): string => (/^\d+$/.test(pos) ? `P${pos}` : pos);

const MAX_NAME = 15;
const MAX_TEAM = 12;

/** Cut long names so tables stay phone-width. */
export const fitName = (name: string): string => name.slice(0, MAX_NAME).trim();
export const fitTeam = (team: string): string => team.slice(0, MAX_TEAM).trim();

/** A Discord timestamp, shown in each viewer's time zone: d date, t time, f both, R relative. */
export const timestamp = (date: Date, style: "d" | "t" | "f" | "R"): string =>
  `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
