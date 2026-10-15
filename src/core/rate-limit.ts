/**
 * Channel edits (renames) are limited to ~2 per 10 minutes. By default discord.js waits out
 * the limit, which would stall the job that renamed; fail fast instead and retry next tick.
 */
export function rejectRenameRateLimit(data: { method: string; route: string }): boolean {
  return data.method === "PATCH" && data.route === "/channels/:id";
}
