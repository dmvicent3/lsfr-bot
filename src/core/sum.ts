/** The total of `ns`; 0 when empty. */
export const sum = (ns: number[]): number => ns.reduce((a, b) => a + b, 0);
