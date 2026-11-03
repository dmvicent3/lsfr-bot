import { expect, test } from "bun:test";
import { fakeClick } from "../../../core/fake-interaction.ts";
import { editHandler } from "../../../../src/modules/feedback/components/edit.ts";
import { newEntry, setup } from "../setup.ts";

test("the author gets the form prefilled with the current text", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls } = fakeClick("u1");
  await editHandler.handle(i, [String(id)], ctx);

  expect(calls.modal[0]?.custom_id).toBe(`feedback:save:${id}`);
  expect(JSON.stringify(calls.modal[0])).toContain(`"value":"The clues are too hard"`);
});

test("anyone else is told only the author can change it", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls } = fakeClick("u2");
  await editHandler.handle(i, [String(id)], ctx);

  expect(calls.modal).toEqual([]);
  expect(calls.reply[0]?.content).toBe("Only the author can change this.");
  expect(calls.reply[0]?.flags).toBeDefined();
});

test("outside a server", async () => {
  const { ctx, repo } = setup();
  const id = repo.entries.add(newEntry());
  const { i, calls } = fakeClick("u1", { noGuild: true });
  await editHandler.handle(i, [String(id)], ctx);

  expect(calls.reply[0]?.content).toBe("Feedback works in a server.");
});
