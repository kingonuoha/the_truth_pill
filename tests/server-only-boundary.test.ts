/**
 * Guards the credential graph against reaching the client bundle.
 *
 * `lib/api-token.ts` mints the ADR-017 bearer from `API_TOKEN_SECRET` and
 * `lib/bff.ts` proxies every admin call, so a client-side import of either would
 * be a secret-exposure defect, not a build inconvenience.
 *
 * ⚠️ The obvious marker — `import "server-only"` — is **not** usable on these
 * two modules. That package's default export throws on import, and only resolves
 * to its empty shim under Next's `react-server` condition, which `node --test`
 * does not set. Adding it to `lib/api-token.ts` was measured to fail 4 suites
 * outright (49 tests → 45 pass / 4 fail, all `ERR_MODULE` on the marker), taking
 * `lib/bff.ts` and three other suites down with it transitively. `lib/bff.ts`
 * documents that it is deliberately free of such imports so its decision surface
 * stays unit-testable — this test respects that instead of overriding it.
 *
 * The build is the runtime control: a client import fails on the unresolvable
 * `node:crypto`. This is the earlier, clearer signal, and it fires without a
 * build.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/** Server-only modules that must never be imported by a client component. */
const SERVER_ONLY_MODULES = [
  "@/lib/api-token",
  "@/lib/api",
  "@/lib/bff",
  "@/lib/bff-handler",
  "@/lib/server-action-guards",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
    .map((entry) => join(entry.parentPath ?? dir, entry.name));
}

describe("server-only credential modules stay off the client", () => {
  it("no 'use client' module imports a server-only credential module", () => {
    const offenders: string[] = [];

    for (const root of ["app", "components", "hooks"]) {
      for (const file of sourceFiles(join(WEB_ROOT, root))) {
        const source = readFileSync(file, "utf8");
        if (!/^\s*["']use client["']/m.test(source)) continue;

        for (const modulePath of SERVER_ONLY_MODULES) {
          const importPattern = new RegExp(
            `from\\s+["']${modulePath.replace(/[/@]/g, "\\$&")}["']`,
          );
          if (importPattern.test(source)) {
            offenders.push(`${relative(WEB_ROOT, file)} → ${modulePath}`);
          }
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `client components must not import server-only modules:\n${offenders.join("\n")}`,
    );
  });
});
