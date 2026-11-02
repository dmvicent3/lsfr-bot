const ids = (list: string[]) => list.map((q) => `wd:${q}`).join(", ");

/** One SPARQL query per fact group, each returning rows (?iso ?p ?v); run one after another. */
export const FACT_QUERIES: string[] = [
  `SELECT ?iso ?p ?v WHERE {
    ?c wdt:P297 ?iso.
    { ?c wdt:P30 ?v. BIND("continent" AS ?p) }
    UNION { ?c wdt:P41 ?v. BIND("flag" AS ?p) }
    UNION { ?c wdt:P1622 ?v. BIND("driving" AS ?p) }
  }`,
  `SELECT ?iso ?p ?v WHERE {
    ?c wdt:P297 ?iso.
    { ?c wdt:P47 ?n. ?n wdt:P297 ?v. BIND("border" AS ?p) }
  }`,
  `SELECT DISTINCT ?iso ?p ?v WHERE {
    ?c wdt:P297 ?iso.
    VALUES ?v { ${ids(["Q458", "Q7184", "Q7785", "Q243630", "Q7795"]).replaceAll(", ", " ")} }
    { ?c p:P463 ?st. ?st ps:P463 ?v. FILTER NOT EXISTS { ?st pq:P582 ?end } }
    UNION { ?v p:P527 ?st. ?st ps:P527 ?c. FILTER(?v = wd:Q7184). FILTER NOT EXISTS { ?st pq:P582 ?end } }
    BIND("member" AS ?p)
  }`,
  `SELECT ?iso ?p ?v WHERE {
    ?c wdt:P297 ?iso.
    ?c p:P37 ?st. ?st ps:P37 ?v.
    FILTER(?v IN (${ids(["Q1860", "Q150", "Q1321", "Q13955", "Q5146"])}))
    FILTER NOT EXISTS { ?st pq:P582 ?end }
    BIND("language" AS ?p)
  }`,
  `SELECT ?iso ?p ?v WHERE {
    ?c wdt:P297 ?iso.
    { ?c wdt:P31/wdt:P279* ?v. FILTER(?v IN (${ids(["Q123480", "Q112099"])})) BIND("type" AS ?p) }
    UNION { ?c wdt:P122/wdt:P279* wd:Q7269. BIND(wd:Q7269 AS ?v) BIND("monarchy" AS ?p) }
    UNION { ?c wdt:P35 ?h. ?h wdt:P39/wdt:P279* wd:Q116. BIND(wd:Q7269 AS ?v) BIND("monarchy" AS ?p) }
  }`,
  `SELECT ?iso ?p ?v WHERE {
    ?c wdt:P297 ?iso.
    { ?c rdfs:label ?v. FILTER(LANG(?v) = "en") }
    UNION { ?c skos:altLabel ?v. FILTER(LANG(?v) = "en") }
    BIND("alias" AS ?p)
  }`,
];
