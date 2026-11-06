/** The part of discord.js `REST` (and `client.rest`) polls use; tests pass a fake. */
export interface Rest {
  get(route: `/${string}`, options?: { query?: URLSearchParams }): Promise<unknown>;
  post(route: `/${string}`, options?: { body?: unknown }): Promise<unknown>;
}

export interface PollRequest {
  question: string;
  options: string[];
  hours: number;
  multi: boolean;
}

/** The poll on a message: whether Discord has finalised it, and its answers. */
export interface PollState {
  finalized: boolean;
  answers: { id: number; text: string; count: number | null }[];
}

/** A poll Discord accepted. */
export interface PostedPoll {
  messageId: string;
  endsAt: number;
}
