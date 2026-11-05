/** Every letter a–z: bit `c` stands for the letter `a` + c. */
export const ALL_LETTERS = (1 << 26) - 1;

export const letterBit = (word: string, pos: number): number => 1 << (word.charCodeAt(pos) - 97);

export function setBit(bits: Uint32Array, k: number): void {
  bits[k >> 5]! |= 1 << (k & 31);
}

/** The indices of the set bits, ascending. */
export function members(bits: Uint32Array): number[] {
  const out: number[] = [];

  for (let w = 0; w < bits.length; w++) {
    for (let x = bits[w]!; x !== 0; x &= x - 1) out.push(w * 32 + 31 - Math.clz32(x & -x));
  }

  return out;
}

export function orInto(out: Uint32Array, bits: Uint32Array): void {
  for (let w = 0; w < out.length; w++) out[w]! |= bits[w]!;
}

export function andInto(out: Uint32Array, bits: Uint32Array): void {
  for (let w = 0; w < out.length; w++) out[w]! &= bits[w]!;
}
