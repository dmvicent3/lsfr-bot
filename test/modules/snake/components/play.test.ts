import { describe, expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { viewText } from "../../crossword/view-text.ts";
import { snakeComponents } from "../../../../src/modules/snake/components/components.ts";
import { STALE } from "../../../../src/modules/snake/components/guard.ts";
import { snakeModals } from "../../../../src/modules/snake/modals.ts";
import { DATE, STAMP, setup, stored } from "./setup.ts";

const handlers = snakeComponents(() => 0.5);
const handler = (action: string) => handlers.find((h) => h.id === `snake:${action}`)!;
const [answer] = snakeModals();

type Ctx = ReturnType<typeof setup>["ctx"];

async function click(action: string, args: string[], ctx: Ctx, user = "u") {
  const { i, calls } = fakeClick(user);
  await handler(action).handle(i, args, ctx);

  return calls;
}

async function submit(text: string, args: string[], ctx: Ctx, opts = {}) {
  const { i, calls } = fakeModal("u", text, opts);
  await answer!.handle(i, args, ctx);

  return calls;
}

test("every button and the modal have a handler", () => {
  expect(handlers.map((h) => h.id)).toEqual([
    "snake:guess",
    "snake:giveup",
    "snake:new",
    "snake:page",
  ]);
  expect(answer?.id).toBe("snake:answer");
});

describe("an old board's Guess button", () => {
  test("points to /snake guess", async () => {
    const { ctx } = setup();
    const calls = await click("guess", [DATE, STAMP], ctx);
    expect(calls.modal).toHaveLength(0);
    expect(calls.reply[0]?.content).toBe("Guess with `/snake guess word:`.");
  });

  test("on a practice board, with the practice option", async () => {
    const { ctx } = setup(null);
    const calls = await click("guess", ["practice", STAMP], ctx);
    expect(calls.reply[0]?.content).toBe("Guess with `/snake guess word: practice:True`.");
  });
});

describe("the guess modal", () => {
  test("a word is added and the board redrawn as emoji rows", async () => {
    const { ctx, repo } = setup();
    const calls = await submit("Permit", [DATE, STAMP], ctx);
    expect(stored(repo)?.guesses).toEqual(["permit"]);
    expect(viewText(calls.update[0])).toContain("**Snake #4** · 1 guess");
    expect(viewText(calls.update[0])).toContain("`P E R M I T` 🟨🟩⬛🟩⬛⬛");
    expect(calls.update[0]?.files).toBeUndefined();
    expect(calls.update[0]?.attachments).toEqual([]);
  });

  test("a refused word is told privately and not counted", async () => {
    const { ctx, repo } = setup({ guesses: ["permit"] });
    const calls = await submit("qzxv", [DATE, STAMP], ctx);
    expect(calls.reply[0]).toMatchObject({
      content: "That's not in the word list. Not counted.",
      flags: MessageFlags.Ephemeral,
    });
    expect((await submit("permit", [DATE, STAMP], ctx)).reply[0]?.content).toContain(
      "already tried",
    );
    expect((await submit("a", [DATE, STAMP], ctx)).reply[0]?.content).toContain("2 to 10 letters");
    expect(stored(repo)?.guesses).toEqual(["permit"]);
  });

  test("the answer solves it, scores it and announces it without the word", async () => {
    const { ctx, repo } = setup({ guesses: ["permit", "imply"] });
    const calls = await submit("example", [DATE, STAMP], ctx);
    expect(stored(repo)).toMatchObject({ solved: true, points: 80, streak: 1 });
    expect(viewText(calls.update[0])).toContain("**80 points**");
    expect(calls.send[0]?.content).toBe(
      "<@u> solved Snake #4 in 3 guesses — 80 pts\n🟨🟩⬛🟩⬛⬛\n⬛💚💚💚⬛\n🟢💚💚💚💚💚🟢",
    );
    expect(calls.send[0]?.content).not.toMatch(/example|permit|imply/i);
  });

  test("a submit from outside the board gets the board as a private reply", async () => {
    const { ctx } = setup();
    const calls = await submit("imply", [DATE, STAMP], ctx, { notFromMessage: true });
    expect(calls.update).toHaveLength(0);
    expect(calls.reply[0]?.flags).toEqual([MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]);
  });

  test("practice: the answer finishes it, no announcement", async () => {
    const { ctx } = setup(null, {});
    const calls = await submit("example", ["practice", STAMP], ctx);
    expect(viewText(calls.update[0])).toContain("Solved in 1 guess!");
    expect(calls.send).toHaveLength(0);
  });
});

describe("Give up and New", () => {
  test("give up: 0 points, the word shown, the loss announced", async () => {
    const { ctx, repo } = setup({ guesses: ["permit"] });
    const calls = await click("giveup", [DATE, STAMP], ctx);
    expect(stored(repo)).toMatchObject({ solved: false, points: 0, streak: 0 });
    expect(viewText(calls.update[0])).toContain("the word was **EXAMPLE**");
    expect(calls.send[0]?.content).toBe("<@u> gave up on Snake #4 after 1 guess\n🟨🟩⬛🟩⬛⬛");
  });

  test("another player's click finds their own round, not the owner's", async () => {
    const { ctx, repo } = setup();
    const calls = await click("giveup", [DATE, STAMP], ctx, "v");
    expect(calls.reply[0]?.content).toBe(STALE);
    expect(stored(repo)?.finishedAt).toBeNull();
  });

  test("New starts a fresh practice round in place", async () => {
    const { ctx, repo } = setup(null, { guesses: ["imply"], finishedAt: 4 });
    const calls = await click("new", [], ctx);
    expect(repo.practice.get("g", "u")).toMatchObject({ guesses: [], finishedAt: null });
    expect(viewText(calls.update[0])).toContain("**Practice snake** · 0 guesses");
  });
});
