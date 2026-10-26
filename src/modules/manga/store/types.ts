/** A followed (or once followed) manga; `highest` is the highest chapter number already seen. */
export interface Series {
  id: string;
  title: string;
  highest: number | null;
  latestUpload: string | null;
  checkedAt: number;
}

export interface SeriesRow {
  id: string;
  title: string;
  highest: number | null;
  latest_upload: string | null;
  checked_at: number;
}

/** What a feed check stores once all of a series' posts are sent. */
export interface Checked {
  title: string;
  latestUpload: string | null;
  checkedAt: number;
}
