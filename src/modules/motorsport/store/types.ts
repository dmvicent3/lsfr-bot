export interface PicksRow {
  user_id: string;
  p1: string | null;
  p2: string | null;
  p3: string | null;
}

export interface FollowedRow {
  series: string;
  channel_id: string;
  role_id: string;
  pinned_message_id: string;
  pinned_event_id: string | null;
  channel_name: string | null;
  renamed_at: number | null;
}

export interface SessionRow {
  series: string;
  event_id: string;
  event_name: string;
  session_id: string;
  title: string;
  start: number;
  end: number;
  pingable: number;
}

export interface DueRow {
  series: string;
  event_id: string;
  session_id: string;
  channel_id: string;
  message_id: string;
}
