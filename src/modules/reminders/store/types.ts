export interface ReminderRow {
  id: number;
  guild_id: string;
  channel_id: string;
  author_id: string;
  target_id: string;
  target_kind: "user" | "role";
  text: string;
  due_at: number;
  created_at: number;
  sent_at: number | null;
  message_id: string | null;
}
