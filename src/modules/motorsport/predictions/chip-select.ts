import type { ChipOption, PickerView } from "./types.ts";
import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ComponentType,
} from "discord.js";

/** The picker's chip select; its id names the session so the picker re-renders on it. */
export function chipSelect(
  { info, session }: Pick<PickerView, "info" | "session">,
  options: readonly ChipOption[],
): APIActionRowComponent<APIComponentInMessageActionRow> {
  return {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: `motorsport:chip:${info.key}:${session.eventId}:${session.sessionId}`,
        placeholder: "Chip: each once a season, one per weekend",
        options: options.map((o) => ({ ...o })),
      },
    ],
  };
}
