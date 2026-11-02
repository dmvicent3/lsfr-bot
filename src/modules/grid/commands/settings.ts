import { zoneSettingsHandler } from "../../../core/zone-command.ts";
import { saveGridTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

export const settings = zoneSettingsHandler<CommandCtx>("country grid", saveGridTimeZone);
