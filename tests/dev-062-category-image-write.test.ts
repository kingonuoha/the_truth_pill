import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, "..", rel), "utf8");
}

// DEV-062: the frozen component wrote a fetched Pexels image back to the
// category record via the admin `categories.update` mutation, invoked from an
// anonymously-rendered page. The write is removed; only the read+render remains.
describe("DEV-062 public categories.update write removed", () => {
  const src = read("components/dynamic-category-image.tsx");

  it("has no Convex import or Convex hook", () => {
    assert.equal(/from\s+["']convex/.test(src), false, "convex import");
    assert.equal(/from\s+["']@\/convex/.test(src), false, "@/convex import");
    assert.equal(/require\(\s*["']convex/.test(src), false, "convex require");
    assert.equal(/useMutation|useQuery|useAction/.test(src), false, "no Convex hooks");
  });

  it("does not call any update mutation", () => {
    assert.equal(/categories\s*\.\s*update\s*\(/.test(src), false, "categories.update(");
    assert.equal(/\.\s*update\s*\(/.test(src), false, "any .update( call");
  });
});
