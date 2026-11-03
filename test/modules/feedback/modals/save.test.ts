import { expect, test } from "bun:test";
import { fakeModal } from "../../../core/fake-interaction.ts";
import { saveHandler } from "../../../../src/modules/feedback/modals/save.ts";
import { newEntry, setup } from "../setup.ts";

test("the author's edit updates the post in place and makes it unread again", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  repo.entries.markRead([id], 2000);
  const { i, calls } = fakeModal("u1", "Clues are fine now");
  await saveHandler.handle(i, [String(id)], ctx);

  expect(repo.entries.get(id)).toMatchObject({ text: "Clues are fine now", readAt: null });
  expect(repo.entries.get(id)?.editedAt).toBeNumber();
  expect(calls.update[0]?.content).toBe(
    "💬 **Feedback · crossword** from <@u1>\nClues are fine now\n*(edited)*",
  );
  expect(calls.update[0]?.allowedMentions).toEqual({ parse: [] });
  expect(calls.reply).toEqual([]);
});

test("not from the message: saved and told", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls } = fakeModal("u1", "Clues are fine now", { notFromMessage: true });
  await saveHandler.handle(i, [String(id)], ctx);

  expect(repo.entries.get(id)?.text).toBe("Clues are fine now");
  expect(calls.reply[0]?.content).toBe("Feedback saved.");
});

test("anyone else's edit is refused", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls } = fakeModal("u2", "Hijacked text");
  await saveHandler.handle(i, [String(id)], ctx);

  expect(repo.entries.get(id)?.text).toBe("The clues are too hard");
  expect(calls.reply[0]?.content).toBe("Only the author can change this.");
});
