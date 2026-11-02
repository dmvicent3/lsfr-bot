/** Canonical form of a country name for comparing and first-letter rules. */
export function normaliseName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^the /, "")
    .replace(/\s+/g, " ")
    .trim();
}
