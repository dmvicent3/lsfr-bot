import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../core/db.ts";
import type { FetchFn } from "../../../core/guards.ts";
import { coreMigrations } from "../../../core/settings.ts";
import { collectRulings, type RulingDeps } from "./collect-rulings.ts";
import type { PostMessage, PostTarget } from "../post.ts";
import { motorsportMigrations, MotorsportRepo } from "../repo.ts";
import { FIA_DOCUMENTS } from "./fia.ts";
import { textFixture } from "../testing/fixtures.ts";
import type { Session } from "../types.ts";

const session = (sessionId: string, start: string, hours = 1): Session => ({
  series: "f1",
  eventId: "singapore-grand-prix",
  eventName: "Singapore Grand Prix",
  sessionId,
  title: sessionId,
  start: new Date(start),
  end: new Date(Date.parse(start) + hours * 3_600_000),
  pingable: true,
});

const AFTER_RACE = Date.parse("2026-10-12T00:00:00Z");
const DOCS = "https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_";

let repo: MotorsportRepo;
let posts: { target: PostTarget; message: PostMessage }[];
let fetched: string[];

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
  repo.replaceSessions(
    "f1",
    [
      session("practice-1", "2026-10-09T08:30:00Z"),
      session("sprint-qualification", "2026-10-09T12:30:00Z"),
      session("sprint-race", "2026-10-10T09:00:00Z"),
      session("qualifying", "2026-10-10T13:00:00Z"),
      session("race", "2026-10-11T12:00:00Z", 2),
    ],
    0,
  );
  repo.insertFollowed({
    series: "f1",
    channelId: "c",
    roleId: "r",
    pinnedMessageId: "m",
    pinnedEventId: null,
    channelName: null,
    renamedAt: null,
  });
  posts = [];
  fetched = [];
});

async function deps(overrides: Partial<RulingDeps> = {}): Promise<RulingDeps> {
  const page = await textFixture("fia-documents.html");
  const texts = new Map([
    [
      `${DOCS}infringement_-_car_23_-_causing_a_collision_with_car_5.pdf`,
      "fia-ruling-no-penalty.txt",
    ],
    [
      `${DOCS}infringement_-_car_14_-_pu_element_and_changes_made_during_parc_ferme.pdf`,
      "fia-ruling-pit-lane.txt",
    ],
    [
      `${DOCS}decision_-_car_44_-_alleged_leaving_the_track_and_gaining_an_advantage.pdf`,
      "fia-ruling-nfa.txt",
    ],
  ]);
  const fetchFn: FetchFn = async (url) => {
    fetched.push(url);
    if (url === FIA_DOCUMENTS) return new Response(page);
    const name = texts.get(url);
    // Every other ruling: a document we can't read as a ruling.
    return new Response(name ? await textFixture(name) : "Some other document");
  };
  return {
    fetchFn,
    pdfText: async (bytes) => new TextDecoder().decode(bytes),
    summarize: async () => "Pit lane start for parc fermé changes.",
    post: async (target, message) => {
      posts.push({ target, message });
    },
    ...overrides,
  };
}

test("posts each post-session ruling once, oldest first, in the weekend thread", async () => {
  const d = await deps();
  await collectRulings(repo, AFTER_RACE, d);
  expect(posts.map((p) => p.message.content.split("\n")[0])).toEqual([
    "⚖️ Alexander Albon · Car 23 · Sprint: Car 23 collided with Car 5 in Turn 16 → No Penalty is applied",
    "⚖️ **Fernando Alonso** · Car 14 · Qualifying",
    "⚖️ Lewis Hamilton · Car 44 · Race: Car 44 left the track in turn 1 → No further action.",
  ]);
  expect(posts[0]?.target).toEqual({
    series: "f1",
    eventId: "singapore-grand-prix",
    eventName: "Singapore Grand Prix",
    place: "thread",
  });
  const penalty = posts[1]?.message;
  expect(penalty?.content).toEndWith("\n> Pit lane start for parc fermé changes.");
  expect(penalty?.files?.[0]?.name).toBe(
    "infringement-car-14-pu-element-and-changes-made-during-parc-ferme.txt",
  );
  expect(penalty?.files?.[0]?.data).toContain("Required to start the Race from the pit lane.");
  expect(posts[0]?.message.files ?? []).toEqual([]);

  posts = [];
  fetched = [];
  await collectRulings(repo, AFTER_RACE + 600_000, d);
  expect(posts).toEqual([]);
  expect(fetched).toEqual([FIA_DOCUMENTS]);
});

test("Gemini failing still posts the ruling, without a summary", async () => {
  const d = await deps({
    summarize: async () => {
      throw new Error("quota");
    },
  });
  await collectRulings(repo, AFTER_RACE, d);
  expect(posts[1]?.message.content).toBe(
    "⚖️ **Fernando Alonso** · Car 14 · Qualifying\nThe following Power Unit elements have been used: 6th Turbocharger (TC) In addition, the setup of the suspension has been changed while under parc fermé. The team also continued to work on the car beyond the covers-on time. → **Required to start the Race from the pit lane.**",
  );
});

test("a failed post is retried next run", async () => {
  await collectRulings(
    repo,
    AFTER_RACE,
    await deps({
      post: async () => {
        throw new Error("discord down");
      },
    }),
  );
  await collectRulings(repo, AFTER_RACE, await deps());
  expect(posts).toHaveLength(3);
});

test("nothing outside the weekend window, unfollowed, or when the page is another event", async () => {
  await collectRulings(repo, Date.parse("2026-10-09T10:00:00Z"), await deps());
  await collectRulings(repo, Date.parse("2026-10-13T00:00:00Z"), await deps());
  expect(fetched).toEqual([]);

  repo.replaceSessions(
    "f1",
    repo.listSessions("f1").map((s) => ({ ...s, eventName: "Japanese Grand Prix" })),
    1,
  );
  await collectRulings(repo, AFTER_RACE, await deps());
  expect(fetched).toEqual([FIA_DOCUMENTS]);
  expect(posts).toEqual([]);

  repo.deleteSeries("f1");
  fetched = [];
  await collectRulings(repo, AFTER_RACE, await deps());
  expect(fetched).toEqual([]);
});
