import type { SeriesInfo, Session } from "../types.ts";

export interface MemberSource {
  id: string;
  members: { fetch(): Promise<unknown> };
}

export interface PingInput {
  info: SeriesInfo;
  session: Session;
  roleId: string;
  roleHasMembers: boolean;
  roleMemberIds: ReadonlySet<string>;
  oneOffUserIds: string[];
}

export interface PingPayload {
  content: string;
  allowedMentions: { roles: string[]; users: string[] };
}
