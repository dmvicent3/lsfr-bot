import { expect, test } from "bun:test";
import { answerModal } from "../../../../src/modules/grid/render/modal.ts";
import { GRID } from "./fixtures.ts";

test("answer modal fields", () => {
  const json = answerModal("2026-11-05", 4, GRID).toJSON();
  expect(json.custom_id).toBe("grid:answer:2026-11-05:4");
  expect(json.title).toBe("Cell B2");
  expect(json.components).toMatchObject([
    {
      components: [
        {
          custom_id: "country",
          label: "Country",
          placeholder: "Asia · Island nation",
          max_length: 60,
          required: true,
          style: 1,
        },
      ],
    },
  ]);
});
