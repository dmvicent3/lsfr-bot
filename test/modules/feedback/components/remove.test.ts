import { expect, test } from "bun:test";
import { fakeClick } from "../../../core/fake-interaction.ts";
import { removeHandler } from "../../../../src/modules/feedback/components/remove.ts";
import { newEntry, setup } from "../setup.ts";

/** A click whose message delete succeeds or throws; `deleted` counts the deletes. */
function click(userId: string, failDelete = false) {
  const { i, calls } = fakeClick(userId);
  const state = { deleted: 0 };
  Object.assign(i, {
    message: {
      delete: async () => {
        if (failDelete) throw new Error("missing access");

        state.deleted++;
      },
    },
  });

  return { i, calls, state };
}

test("the author's remove deletes the post and keeps the row, marked removed", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls, state } = click("u1");
  await removeHandler.handle(i, [String(id)], ctx);

  expect(state.deleted).toBe(1);
  expect(repo.entries.get(id)?.removedAt).toBeNumber();
  expect(calls.reply).toEqual([]);
});

test("when the delete fails the post says it was removed, without buttons", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls } = click("u1", true);
  await removeHandler.handle(i, [String(id)], ctx);

  expect(calls.update).toEqual([{ content: "🗑️ Feedback removed.", components: [] }]);
});

test("anyone else's remove is refused", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls, state } = click("u2");
  await removeHandler.handle(i, [String(id)], ctx);

  expect(state.deleted).toBe(0);
  expect(repo.entries.get(id)?.removedAt).toBeNull();
  expect(calls.reply[0]?.content).toBe("Only the author can change this.");
});

test("an already removed entry is gone", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  repo.entries.remove(id, 5);
  const { i, calls } = click("u1");
  await removeHandler.handle(i, [String(id)], ctx);

  expect(calls.reply[0]?.content).toBe("This feedback was removed.");
});
