import { describe, expect, test } from "bun:test";
import { keyedLock, nonOverlapping, safely } from "./scheduler.ts";

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

describe("keyedLock", () => {
  test("runs calls with the same key one after another", async () => {
    const lock = keyedLock();
    const order: string[] = [];
    const step = (name: string, ms: number) =>
      lock("f1", async () => {
        order.push(`${name} start`);
        await Bun.sleep(ms);
        order.push(`${name} end`);
      });
    await Promise.all([step("a", 20), step("b", 0)]);
    expect(order).toEqual(["a start", "a end", "b start", "b end"]);
  });

  test("different keys run in parallel, and a failure frees the key", async () => {
    const lock = keyedLock();
    const order: string[] = [];
    await Promise.all([
      lock("f1", async () => {
        await Bun.sleep(20);
        order.push("f1");
      }),
      lock("wec", async () => {
        order.push("wec");
      }),
    ]);
    expect(order).toEqual(["wec", "f1"]);
    await lock("f1", () => Promise.reject(new Error("boom"))).catch(() => undefined);
    expect(await lock("f1", async () => "ok")).toBe("ok");
  });
});
