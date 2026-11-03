import type { Rest } from "../../../../src/modules/feedback/script/types.ts";

export interface RestCall {
  method: "get" | "post";
  route: string;
  query?: string;
  body?: unknown;
}

/** A REST stand-in answering GETs from `routes` (each gets the query) and POSTs with `posted`. */
export function fakeRest(
  routes: Record<string, (query: URLSearchParams) => unknown>,
  posted: unknown = null,
) {
  const calls: RestCall[] = [];
  const rest: Rest = {
    async get(route, options) {
      calls.push({ method: "get", route, query: options?.query?.toString() ?? "" });

      const answer = routes[route];

      if (!answer) throw new Error(`404 ${route}`);

      return answer(options?.query ?? new URLSearchParams());
    },
    async post(route, options) {
      calls.push({ method: "post", route, body: options?.body });

      return posted;
    },
  };

  return { rest, calls };
}
