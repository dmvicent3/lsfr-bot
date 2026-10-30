/**
 * Builds src/modules/trivia/data/questions.json from every Open Trivia DB question (CC BY-SA 4.0).
 * Usage: bun scripts/build-trivia.ts
 * Re-runs keep the id of each question already in the file (matched by question text).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { asText, isRecord, records } from "../src/core/guards.ts";
import { isBanned } from "../src/modules/trivia/data/banned.ts";
import { classify } from "../src/modules/trivia/data/classify.ts";
import type { Difficulty, Question } from "../src/modules/trivia/types.ts";

const OUT = new URL("../src/modules/trivia/data/questions.json", import.meta.url);
const API = "https://opentdb.com";
/** opentdb allows one request per 5 s per IP. */
const PAUSE_MS = 5_100;
const TOKEN_EMPTY = 4;

type Raw = Record<string, unknown>;

const DIFFICULTIES: Record<string, Difficulty> = { easy: "easy", medium: "medium", hard: "hard" };

const text = (r: Raw, key: string): string => decodeURIComponent(asText(r[key]));

async function json(url: string): Promise<Raw> {
  const body: unknown = await (await fetch(url)).json();

  return isRecord(body) ? body : {};
}

async function download(): Promise<Raw[]> {
  const token = asText((await json(`${API}/api_token.php?command=request`))["token"]);
  const all: Raw[] = [];

  for (;;) {
    const page = await json(`${API}/api.php?amount=50&encode=url3986&token=${token}`);

    if (page["response_code"] === TOKEN_EMPTY) return all;

    all.push(...records(page["results"]));
    console.log(`${all.length} questions`);
    await Bun.sleep(PAUSE_MS);
  }
}

function toQuestion(r: Raw, id: number): Question {
  const question = text(r, "question");
  const answer = text(r, "correct_answer");
  const wrong = Array.isArray(r["incorrect_answers"]) ? r["incorrect_answers"] : [];

  return {
    id,
    category: text(r, "category"),
    difficulty: DIFFICULTIES[asText(r["difficulty"])] ?? "medium",
    question,
    answer,
    wrong: wrong.map((w: unknown) => decodeURIComponent(asText(w))),
    kind: classify({ type: r["type"] === "boolean" ? "boolean" : "multiple", question, answer }),
  };
}

const previous: Question[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const idByText = new Map(previous.map((q) => [q.question, q.id]));
let next = Math.max(0, ...previous.map((q) => q.id)) + 1;

const questions = (await download())
  .map((r) => toQuestion(r, idByText.get(text(r, "question")) ?? next++))
  .filter((q) => !isBanned(q))
  .toSorted((a, b) => a.id - b.id);

writeFileSync(OUT, `[\n${questions.map((q) => JSON.stringify(q)).join(",\n")}\n]\n`);

const typed = questions.filter((q) => q.kind === "typed").length;
console.log(`wrote ${questions.length}: ${typed} typed, ${questions.length - typed} choice`);
