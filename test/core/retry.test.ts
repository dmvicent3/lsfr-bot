import { expect, test } from "bun:test";
import { retry } from "../../src/core/retry.ts";

test("retries until success", async () => {
  let calls = 0;
  const result = await retry(
    async () => {
      calls++;
      if (calls < 3) throw new Error("flaky");
      return "ok";
    },
    { attempts: 3, delayMs: 0 },
  );
  expect(result).toBe("ok");
  expect(calls).toBe(3);
});

test("gives up after the last attempt", async () => {
  let calls = 0;
  const err = await retry(
    async () => {
      calls++;
      throw new Error(`fail ${calls}`);
    },
    { attempts: 2, delayMs: 0 },
  ).catch((e: unknown) => e);
  expect(calls).toBe(2);
  expect(err).toBeInstanceOf(Error);
});
