import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";

const featureRoots = [
  path.join(process.cwd(), "app", "plan-your-home"),
  path.join(process.cwd(), "features", "plan-your-home"),
];

const genericInquiryImport =
  /from\s+["'][^"']*(?:components\/inquiry|lib\/inquiry|types\/inquiry|validation\/inquiry)[^"']*["']/;

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const sourceFiles = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectSourceFiles(entryPath);
      }

      return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
    }),
  );

  return sourceFiles.flat();
}

describe("Plan Your Home feature boundary", () => {
  it("does not import the generic inquiry form domain", async () => {
    const files = (await Promise.all(featureRoots.map(collectSourceFiles))).flat();

    assert.ok(files.length > 0);

    for (const file of files) {
      const source = await readFile(file, "utf8");

      assert.doesNotMatch(
        source,
        genericInquiryImport,
        path.relative(process.cwd(), file),
      );
    }
  });
});
