import { describe, expect, test } from "bun:test";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadBank, loadBankFile } from "../../../../src/modules/crossword/words/load.ts";

describe("loadBankFile", () => {
  test("reads a bank file", () => {
    const path = join(tmpdir(), `bank-${crypto.randomUUID()}.json`);

    writeFileSync(path, JSON.stringify([{ word: "cat", def: "pet", rank: 3 }]));
    expect(loadBankFile(path)).toEqual([{ word: "cat", def: "pet", rank: 3 }]);
  });
});

describe("loadBank", () => {
  test("is cached and sound", () => {
    const bank = loadBank();

    expect(loadBank()).toBe(bank);
    expect(bank.length).toBeGreaterThan(1000);

    for (const w of bank) {
      expect(w.word).toMatch(/^[a-z]{3,7}$/);
      expect(w.def.length).toBeGreaterThanOrEqual(3);
    }
  });
});
