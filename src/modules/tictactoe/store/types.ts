export interface GameRow {
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  player_id: string;
  /** 9 characters of "-", "X" and "O". */
  board: string;
  jevos_mark: string;
  updated_at: number;
}
