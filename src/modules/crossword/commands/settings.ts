import { zoneSettingsHandler } from "../../../core/zone-command.ts";
import { saveCrosswordTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

export const settings = zoneSettingsHandler<CommandCtx>("crossword", saveCrosswordTimeZone);
