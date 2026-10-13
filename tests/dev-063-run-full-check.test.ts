import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");

/** All `.ts` / `.tsx` files below `dir`, skipping build/dependency dirs. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function filesContaining(roots: string[], needle: string): string[] {
  const offenders: string[] = [];
  for (const root of roots) {
    for (const file of walk(root)) {
      if (readFileSync(file, "utf8").includes(needle)) offenders.push(file);
    }
  }
  return offenders;
}

// DEV-063: the frozen "Run Full Check" button fired an unauthenticated,
// repeatable, billed Convex action. Its Convex action (`processScheduleCheck`)
// is gone from the frontend, and the BFF must never expose the Nest internal
// trigger to a browser.
describe("DEV-063 Run Full Check trigger removed", () => {
  it("no processScheduleCheck reference in app/components/hooks/lib", () => {
    const roots = ["app", "components", "hooks", "lib"].map((d) => join(webRoot, d));
    assert.deepEqual(filesContaining(roots, "processScheduleCheck"), []);
  });

  it("no BFF route declares an /internal/ path", () => {
    const offenders = filesContaining([join(webRoot, "app", "api")], "/internal/");
    assert.deepEqual(offenders, []);
  });
});
