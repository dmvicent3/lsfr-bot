import { expect, test } from "bun:test";
import { kaosMessage } from "../../../../src/modules/trivia/render/kaos.ts";
import { kaosAnswer, kaosStart, kaosTick } from "../../../../src/modules/trivia/rounds/kaos.ts";
import { kaos } from "../fixtures.ts";

const list = {
  ...kaos(535, ["Tallahassee", "Austin", "Atlanta"]),
  prompt: "Southern US State Capitals",
};
const names = new Map([["u", "tyh"]]);

test("the title counts answers and points; open items show as ?", () => {
  const [embed] = kaosMessage(kaosStart(list, "k", 0), names).embeds;

  expect(embed?.title).toBe("#535 KAOS · Southern US State Capitals (3 answers) · 10 pts each");
  expect(embed?.description).toBe("1. ?\n2. ?\n3. ?");
});

test("claimed items show who claimed them; the hint shows first letters", () => {
  let r = kaosAnswer(kaosStart(list, "k", 0), { userId: "u", text: "austin", at: 1 }).round;
  r = kaosTick(r, 30_000);

  expect(kaosMessage(r, names).embeds[0]?.description).toBe("1. T…\n2. Austin — tyh\n3. A…");
});

test("after the close, missed items are shown", () => {
  const r = kaosTick(kaosStart(list, "k", 0), 60_000);

  expect(kaosMessage(r, names).embeds[0]?.description).toContain("1. Tallahassee (missed)");
});

test("15 long items stay well under the embed limit", () => {
  const texts = Array.from(
    { length: 15 },
    (_, i) => `${"x".repeat(80)} ${String.fromCharCode(97 + i)}`,
  );
  let r = kaosStart(kaos(1, texts), "k", 0);

  for (const text of texts) r = kaosAnswer(r, { userId: "u", text, at: 1 }).round;

  const description = kaosMessage(r, new Map([["u", "n".repeat(32)]])).embeds[0]?.description;

  expect(description?.length).toBeLessThan(4_096);
});
