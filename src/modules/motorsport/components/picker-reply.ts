import type { SchedulePayload } from "../channels/types.ts";

/** A picker as the reply, or why there is none in place of it; `note` goes on top. */
export function asReply(picker: SchedulePayload | string, note: string | null = null) {
  const top = note ? `${note}\n` : "";

  return typeof picker === "string"
    ? { content: `${top}${picker}`, components: [] }
    : { ...picker, content: `${top}${picker.content}` };
}
