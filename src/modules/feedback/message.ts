import { ButtonStyle } from "discord.js";
import { button, type Row, row } from "../../core/buttons.ts";
import { postText } from "./text.ts";
import type { Entry } from "./types.ts";

/** The public post with its Edit and Remove buttons; pings no one. */
export function postBody(e: Entry): {
  content: string;
  components: Row[];
  allowedMentions: { parse: [] };
} {
  return {
    content: postText(e),
    components: [
      row([
        button(`feedback:edit:${e.id}`, "Edit", ButtonStyle.Secondary),
        button(`feedback:remove:${e.id}`, "Remove", ButtonStyle.Danger),
      ]),
    ],
    allowedMentions: { parse: [] },
  };
}
