import { zoneSettingsHandler } from "../../../core/zone-command.ts";
import { saveGroupsTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

export const settings = zoneSettingsHandler<CommandCtx>("groups", saveGroupsTimeZone);
