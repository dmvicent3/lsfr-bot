import { describe, expect, test } from "bun:test";
import { nonOverlapping, safely } from "./scheduler.ts";

describe("safely", () => {
  test("resolves when the function throws", async () => {
    await safely("test", () => Promise.reject(new Error("boom")));
  });
});

describe("nonOverlapping", () => {
  test("skips calls while the previous run is in flight", async () => {
    let runs = 0;
    let release: (() => void) | undefined;
    const wrapped = nonOverlapping(async () => {
      runs++;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    });
    const first = wrapped();
    const second = wrapped();
    expect(runs).toBe(1);
    release?.();
    await Promise.all([first, second]);
    const third = wrapped();
    expect(runs).toBe(2);
    release?.();
    await third;
  });
});
