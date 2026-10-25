import type { Database } from "bun:sqlite";
import { getSetting } from "../../../core/settings.ts";

export const LEAD_SETTING_KEY = "motorsport.leadMinutes";
export const DEFAULT_LEAD_MINUTES = 60;
const MIN_LEAD = 5;
const MAX_LEAD = 24 * 60;

/** "30m", "1h", "1h30m" → minutes, or null when malformed or outside 5m–24h. */
export function parseLeadTime(input: string): number | null {
  const match = /^(?:(\d+)h)?(?:(\d+)m)?$/i.exec(input.trim());
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;
  const minutes = Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
  return minutes >= MIN_LEAD && minutes <= MAX_LEAD ? minutes : null;
}

export function formatLead(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  return h ? `${h}h` : `${m}m`;
}

export function getLeadMinutes(db: Database): number {
  const stored = Number(getSetting(db, LEAD_SETTING_KEY));
  return Number.isInteger(stored) && stored > 0 ? stored : DEFAULT_LEAD_MINUTES;
}
