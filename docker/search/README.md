# SearXNG: Gork's web search

Gork's chat runs on a small local model (LFM3-VL-2B in the `llm` service). It knows nothing after its
training cutoff and can't browse. For questions about live or recent things (results, news, weather,
who holds a job now), Gork searches the web first with [SearXNG](https://docs.searxng.org/). SearXNG is
a self-hosted metasearch engine: it sends the query to public search engines and merges what they
return. It runs on the Pi as the `search` service. There are no API keys and no accounts.

## Setup

### The service

`docker-compose.yml`:

```yaml
search:
  image: searxng/searxng:2026.10.28-c360868e5 # pinned tag
  restart: unless-stopped
  environment:
    SEARXNG_SECRET: ${SEARXNG_SECRET:-}
  volumes:
    - ./docker/search/settings.yml:/etc/searxng/settings.yml:ro
  mem_limit: 256m
```

- **No published port.** Only containers on the compose network can reach it, at
  `http://search:8080`. That is why the bot limiter is off in the settings: nothing outside can send
  it traffic.
- **The bot finds it** through `SEARCH_URL: http://search:8080`, set in the bot's compose environment.
  When `SEARCH_URL` is unset, chat still works but never searches.
- **The secret.** `SEARXNG_SECRET` goes in `.env` on the Pi; it is any long random string, made once
  with `openssl rand -hex 32`. It overrides the placeholder `secret_key` in the settings file. SearXNG
  uses it to sign its own cookies and tokens. Don't commit it.
- **The settings file** is mounted read-only. SearXNG only reads it at start, so after changing it run
  `docker compose restart search`. `up -d` alone won't notice a change to a mounted file.

### `settings.yml`

```yaml
use_default_settings:
  engines:
    keep_only: [bing, yahoo]
engines:
  - { name: bing, disabled: false }
  - { name: yahoo, disabled: false }
server:
  secret_key: "set-SEARXNG_SECRET-in-env"
  limiter: false
  image_proxy: false
search:
  safe_search: 1
  default_lang: en
  formats: [html, json]
```

- `use_default_settings` starts from SearXNG's built-in config. `keep_only` throws away every other
  engine.
- Bing is off by default upstream, so it has to be switched on with `disabled: false`.
- `formats` must include `json`, since the bot asks for JSON. Without it SearXNG answers 403.
- `safe_search: 1` is moderate filtering.

### Why only Bing and Yahoo

On 2026-10-31 I ran the engines from the Pi's own connection (a temporary SearXNG container on port
8099, with test queries like "f1 fp1 results today" and "uk prime minister"):

| Engine                       | Result from the Pi                                   |
| ---------------------------- | ---------------------------------------------------- |
| Bing                         | works                                                |
| Yahoo                        | works                                                |
| DuckDuckGo                   | CAPTCHA                                              |
| Brave                        | worked at first, then "Suspended: too many requests" |
| Qwant                        | access denied                                        |
| Google                       | access denied                                        |
| Startpage, Mojeek, Presearch | no results added                                     |
| Wikipedia                    | 0 results for these queries                          |

Engines block or rate-limit scrapers, and this can change from week to week. If search goes quiet,
re-run the check. One way, from the compose directory on the Pi:

```sh
docker compose exec bot bun -e 'const d = await (await fetch("http://search:8080/search?q=uk+prime+minister&format=json")).json(); console.log(d.results.length, [...new Set(d.results.flatMap(r => r.engines))], d.unresponsive_engines)'
```

The output shows how many results came back, which engines gave them, and which engines failed and why.
To try another engine, add it to both lists in `settings.yml` and restart `search`.

## How a chat reply uses it

Everything below lives in the bot (`src/modules/chat/`, `src/core/`). SearXNG itself only answers
`GET /search?q=…&format=json`.

1. **Should Gork search?** jev (the yes/no classifier service) is asked: "Does answering this message
   need current or recent information from the web?" At 0.5 or more, Gork searches. A joke or a coding
   question doesn't search; "FP1 results", "who is the PM now" or "weather tomorrow" do. If jev is down,
   Gork doesn't search. The 2B model isn't asked to decide, because in tests it skipped its search tool
   and made up links.
2. **What to search for.** The message's text. A short follow-up (under 6 words, like "and the
   qualifying?") is joined to the user message before it in the reply chain. Filler words ("give me",
   "the", "current"…) are removed and the year is added when none is named. So "give me fp1 results for
   the current session of f1" becomes `fp1 results session f1 2026`.
3. **Search.** One request to SearXNG, with a 10 s timeout, keeping the top 5 results (title, link, and
   snippet cut to 300 characters). Any result that shares fewer than half the question's words is
   dropped. Bing pads thin queries with unrelated local pages (landscapers, car ads, shop finders).
4. **Read pages.** The first two results that aren't a site's front page are fetched at the same time:
   8 s timeout, HTML only, first 1 MB. Each page is turned into plain text, with table rows as
   `cell | cell`. Gork keeps about 2,500 characters around the lines that best match the question,
   preferring a match with a table under it, and uses the better of the two pages. A page that blocks
   the bot (403/429), isn't HTML, or doesn't mention the question is skipped.
5. **Answer.** The results and page text are added to the end of the user's message, dated, with
   "Answer from these results. Don't list links; they are added for you." The model writes the answer.
   Then code, not the model, adds `Sources:` with the top 3 links in `<…>`, so Discord doesn't embed
   them.

If the search fails or nothing relevant comes back, Gork answers from the model alone. If a page can't
be read, it answers from the snippets.

**Timing on the Pi:** a searched answer takes about 20–30 s (jev about 1 s, search about 1–2 s, pages
up to 8 s, the rest is the model reading and writing). A plain answer takes about 5–15 s.

## Known limits

- **Only two engines.** If Bing or Yahoo start blocking the Pi, results get thin. See the check above.
- **"Last" and "current" can be stale.** The engines rank by relevance, not date. "Who won the last
  MotoGP race?" can come back with an earlier race in the same season.
- **Weather and live-timing sites often block bots or build their pages with JavaScript.** Then only
  the snippets are left, and the model can over-read them. Treat weather numbers with care.
- **The model is small.** It may still mix facts from different results, so the Sources line is there
  for checking.
