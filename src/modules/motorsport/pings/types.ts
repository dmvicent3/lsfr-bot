import type { Guild, Role } from "discord.js";
import type { SeriesChannel } from "../channels/types.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { Followed, SeriesInfo, Session } from "../types.ts";

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

/** One series' tick: the follow, the minute it runs at, and how early pings go out. */
export interface TickRun {
  guild: Guild;
  repo: MotorsportRepo;
  followed: Followed;
  leadMs: number;
  now: number;
}

/** Where pings go and who already gets them through the role. */
export interface PingTarget {
  channel: SeriesChannel;
  role: Role;
  roleMemberIds: ReadonlySet<string>;
}
