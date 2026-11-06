/** A day's map: the mines, the pre-opened cell and everything it opens. */
export interface DailyMap {
  field: boolean[];
  opening: number;
  open: number[];
}
