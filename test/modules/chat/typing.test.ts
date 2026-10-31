import { expect, test } from "bun:test";
import { keepTyping } from "../../../src/modules/chat/typing.ts";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("types now, again every interval, and stops when told", async () => {
  let sent = 0;
  const stop = keepTyping(async () => {
    sent++;
  }, 20);
  expect(sent).toBe(1);
  await wait(50);
  stop();
  const atStop = sent;
  expect(atStop).toBeGreaterThanOrEqual(2);
  await wait(50);
  expect(sent).toBe(atStop);
});

test("a typing call that fails is ignored", async () => {
  const stop = keepTyping(async () => {
    throw new Error("missing access");
  }, 10);
  await wait(30);
  stop();
});
