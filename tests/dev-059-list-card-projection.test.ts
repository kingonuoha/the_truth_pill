import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, "..", rel), "utf8");
}

// DEV-059: the list projection (`ArticleListItemDto`) carries neither
// `readingTime` nor `type`, so the tag/pillar cards must not render them.
describe("DEV-059 list-card projection", () => {
  for (const file of ["app/tags/[slug]/page.tsx", "app/pillars/[slug]/page.tsx"]) {
    it(`${file} does not reference phantom list fields`, () => {
      const src = read(file);
      assert.equal(
        /article\.readingTime/.test(src),
        false,
        "ArticleListItemDto has no readingTime",
      );
      assert.equal(
        /article\.type\b/.test(src),
        false,
        "ArticleListItemDto has no type",
      );
    });
  }
});

// DEV-060: the public author card is `{id,name,profileImage}` — no email, role,
// or createdAt — so the author page must not render them.
describe("DEV-060 author projection", () => {
  it("author-content does not render email/role/createdAt", () => {
    const src = read("app/author/[id]/author-content.tsx");
    assert.equal(/author\.email/.test(src), false);
    assert.equal(/author\.role/.test(src), false);
    assert.equal(/author\.createdAt/.test(src), false);
  });
});
