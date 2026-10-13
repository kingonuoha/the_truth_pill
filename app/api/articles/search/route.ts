import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callerSub, parseStrictQuery, proxyToNest } from "@/lib/bff";
import { runBff } from "@/lib/bff-handler";
import { searchArticlesQuery } from "@/lib/bff-schemas";

/**
 * `GET /api/articles/search?query=…` → `GET /api/v1/articles/search`
 * (`@Public()` + `@PublicOperation()` on Nest, `articles.controller.ts:130-132`).
 *
 * **Anonymous-capable.** The navbar search renders for every reader, so a hard
 * 401 would break the site for signed-out visitors. A token is minted only when
 * a session actually exists, so an anonymous caller sends **no** `Authorization`
 * header — never a fabricated principal (bff.ts rule 1).
 *
 * The upstream verb is `GET` and stays `GET`: the frozen `articles.search` is a
 * pure ranked read with no side effect, so nothing here needs the GET-to-POST
 * remap that, say, `engagement/comment` uses.
 *
 * `query` is optional and is the **only** accepted key — the navbar sends
 * `query: ""` until three characters are typed, which Nest answers with `[]`.
 * Any other key, or a duplicated one, is a 400.
 */
export async function GET(request: Request) {
  return runBff("read:content", request, async () => {
    const session = await auth();
    const { status, body } = await proxyToNest({
      method: "GET",
      path: "/articles/search",
      sub: callerSub(session?.user?.id),
      query: parseStrictQuery(searchArticlesQuery, new URL(request.url).searchParams),
    });
    return NextResponse.json(body, { status });
  });
}
