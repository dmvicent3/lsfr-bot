import type { Week } from "../banner/types.ts";
import type { Banner, Driver, StoredPoll } from "../types.ts";
import { driverLine, record } from "./format.ts";

const stamp = (ms: number, style: "F" | "R"): string => `<t:${Math.floor(ms / 1000)}:${style}>`;

/** How the next week's banner is being chosen. */
export function pollStatus(v: {
  polls: readonly StoredPoll[];
  channelId: string | null;
  week: Week;
}): string {
  const posted = v.polls.find((p) => p.messageId !== null);

  if (posted?.channelId) {
    return `Vote for next week's banner in <#${posted.channelId}>; the polls close ${stamp(posted.endsAt, "R")}.`;
  }

  if (v.polls.length > 0)
    return "Next week's polls couldn't be posted, so it will be picked at random.";

  if (!v.channelId)
    return "No gacha channel is set, so next week's banner will be picked at random.";

  return `Polls for next week's banner open ${stamp(v.week.pollsAt, "F")}.`;
}

const how = (voted: boolean): string => (voted ? "chosen by vote" : "picked at random");

/** The featured drivers, the time left and the rules in short. */
export function bannerText(v: {
  banner: Banner;
  five: Driver;
  fours: readonly Driver[];
  week: Week;
}): string {
  const { voted } = v.banner;

  return [
    `**Limited banner** · ends ${stamp(v.week.endsAt, "R")} (${stamp(v.week.endsAt, "F")})`,
    `${driverLine(v.five)} — ${record(v.five)} · ${how(voted.five)}`,
    ...v.fours.map((d) => `${driverLine(d)} — ${record(d)}`),
    `★4s ${how(voted.fours)}. A ★5 here is the featured driver half the time; miss once and the next ★5 is guaranteed. ★4s work the same way.`,
  ].join("\n");
}

/** The announcement when a new banner starts. */
export const newBannerText = (v: { five: Driver; week: Week; voted: boolean }): string =>
  `🏁 **New limited banner:** ${driverLine(v.five)}${v.voted ? ", chosen by your votes" : ""}! On until ${stamp(v.week.endsAt, "F")}. Pull with \`/gacha pull\`.`;
