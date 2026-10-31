import { expect, test } from "bun:test";
import { relevantTo, searchQuery, webQuery } from "../../../src/modules/chat/query.ts";

test("a full question is searched as it is", () => {
  expect(searchQuery("who won the last formula 1 race?", ["what is f1"])).toBe(
    "who won the last formula 1 race?",
  );
});

test("a short follow-up is searched with the question before it", () => {
  expect(searchQuery("and the qualifying?", ["give me fp1 results for f1", ""])).toBe(
    "give me fp1 results for f1 and the qualifying?",
  );
});

test("a short message with nothing before it, or no text at all, stays as it is", () => {
  expect(searchQuery("weather lisbon", [])).toBe("weather lisbon");
  expect(searchQuery("", ["give me fp1 results"])).toBe("");
});

test("what is sent to the search engine: the terms, with the year when none is given", () => {
  expect(webQuery("give me fp1 results for the current session of f1", "2026")).toBe(
    "fp1 results session f1 2026",
  );
  expect(webQuery("who won the 2025 title?", "2026")).toBe("won 2025 title");
});

const result = (title: string, url: string, snippet = "") => ({ title, url, snippet });

test("results sharing too few words with the question are dropped (search engine junk)", () => {
  const junk = result("Find landscapers near me", "https://checkatrade.com/landscapers");
  const fp1 = result("F1 Results: Mexican GP 2026 – FP1", "https://planetf1.com/fp1");
  const report = result(
    "Leclerc leads in Mexico",
    "https://f1.com/fp1-leclerc",
    "first practice session",
  );
  expect(
    relevantTo([junk, fp1, report], "give me fp1 results for the current session of f1"),
  ).toEqual([fp1, report]);
  const pm = result(
    "Premiership of Andy Burnham",
    "https://en.wikipedia.org/wiki/Burnham",
    "UK prime minister",
  );
  expect(relevantTo([pm, junk], "who is the UK PM?")).toEqual([pm]);
});

test("a result must match at least half the question's words, rounded up", () => {
  const lastOnly = result("Last minute deals", "https://shop.example/last");
  const race = result("MotoGP race results", "https://crash.net/motogp/race", "won the race");
  expect(relevantTo([lastOnly, race], "who won the last motogp?")).toEqual([race]);
  const hey = result("HEY email", "https://www.hey.com/", "hey there");
  expect(relevantTo([hey], "hey, who's the goat of f1?")).toEqual([]);
});

test("a two-word question needs both words in a result", () => {
  const shop = result("GOAT: sneakers", "https://www.goat.com/");
  const film = result("Goat (2026 film)", "https://en.wikipedia.org/wiki/Goat_(2026_film)");
  const f1 = result(
    "Who is the GOAT of F1?",
    "https://planetf1.com/goat",
    "Hamilton or Schumacher",
  );
  expect(relevantTo([shop, film, f1], "hey, who's the goat of f1?")).toEqual([f1]);
});

test("a long question needs at most three of its words in a result", () => {
  const q =
    "can you check rym or albumoftheyear or pitchfork or some other music publication and recommend me some new album releases?";
  const pitchfork = result(
    "New Music Releases and Upcoming Albums in 2026",
    "https://pitchfork.com/news/new-album-releases/",
  );
  const check = result("Check mark - Wikipedia", "https://en.wikipedia.org/wiki/Check_mark");
  expect(relevantTo([pitchfork, check], q)).toEqual([pitchfork]);
});
