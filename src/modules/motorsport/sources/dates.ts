import { SourceFormatError } from "../types.ts";

export function parseDate(value: unknown, where: string): Date {
  if (typeof value !== "string") throw new SourceFormatError(`${where}: date is not a string`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new SourceFormatError(`${where}: invalid date "${value}"`);
  return date;
}

export function byStart<T extends { start: Date }>(a: T, b: T): number {
  return a.start.getTime() - b.start.getTime();
}
