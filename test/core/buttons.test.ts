import { expect, test } from "bun:test";
import { ButtonStyle, ComponentType } from "discord.js";
import { button, row } from "../../src/core/buttons.ts";

test("button and row build component JSON", () => {
  const b = button("x:1", "Go", ButtonStyle.Primary);
  expect(b).toEqual({
    type: ComponentType.Button,
    custom_id: "x:1",
    label: "Go",
    style: ButtonStyle.Primary,
  });
  expect(row([b])).toEqual({ type: ComponentType.ActionRow, components: [b] });
});
