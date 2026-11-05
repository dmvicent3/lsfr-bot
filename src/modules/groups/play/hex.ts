/** Word indices 0–15 as one hex digit each. */
export const toHex = (indices: readonly number[]): string =>
  indices.map((i) => i.toString(16)).join("");

export const fromHex = (digits: string): number[] => digits.split("").map((d) => parseInt(d, 16));
