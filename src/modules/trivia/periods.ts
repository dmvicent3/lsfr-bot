import { ALL_TIME, monthRange, weekRange } from "../../core/periods.ts";
import type { DateRange } from "../../core/types.ts";
import type { Period } from "./types.ts";

const RANGES: Record<Period, (today: string) => DateRange> = {
  today: (today) => ({ from: today, to: today, label: "today" }),
  week: weekRange,
  month: monthRange,
  all: () => ALL_TIME,
};

const PERIODS: readonly string[] = ["today", "week", "month", "all"] satisfies Period[];

const isPeriod = (s: string): s is Period => PERIODS.includes(s);

export const toPeriod = (s: string | null | undefined): Period => (s && isPeriod(s) ? s : "today");

/** The dates a board period covers, weeks from Monday. */
export const periodRange = (period: Period, today: string): DateRange => RANGES[period](today);
