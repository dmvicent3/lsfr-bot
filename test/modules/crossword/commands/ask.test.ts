import { expect, test } from "bun:test";
import { llmAsk } from "../../../../src/modules/crossword/ask.ts";

test("no model URL means no ask", () => {
  expect(llmAsk(null)).toBeNull();
});

test("asks the model server with a system line and returns its text", async () => {
  const calls: { url: string; body: { messages: { role: string; content: string }[] } }[] = [];

  const fetchFn = async (url: string | URL | Request, init?: RequestInit) => {
    const href = typeof url === "string" ? url : "other";
    const text = typeof init?.body === "string" ? init.body : "{}";

    calls.push({ url: href, body: JSON.parse(text) });

    return Response.json({ choices: [{ message: { content: ' {"CRANE":"Bird"} ' } }] });
  };

  const ask = llmAsk("http://llm:8019", fetchFn);

  expect(await ask?.("write clues")).toBe('{"CRANE":"Bird"}');
  expect(calls[0]?.url).toBe("http://llm:8019/v1/chat/completions");
  expect(calls[0]?.body.messages.map((m) => m.role)).toEqual(["system", "user"]);
  expect(calls[0]?.body.messages[1]?.content).toBe("write clues");
});
