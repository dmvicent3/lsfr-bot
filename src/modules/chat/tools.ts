import type { ToolSpec } from "../../core/llm-types.ts";

/** Searches allowed per reply; after that the model is asked without tools, so it must answer. */
export const MAX_SEARCHES = 2;

export const WEB_SEARCH: ToolSpec = {
  name: "web_search",
  description:
    "Search the web for current or specific facts. Use it for news, recent events, prices, schedules or anything you are unsure of.",
  parameters: {
    type: "object",
    properties: { query: { type: "string", description: "What to search for" } },
    required: ["query"],
  },
};
