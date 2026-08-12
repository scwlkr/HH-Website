import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Next loads its JavaScript config without a declaration file.
import nextConfig from "../next.config.mjs";

test("the documented Plan Your Home local URL is an allowed dev origin", () => {
  assert.ok(nextConfig.allowedDevOrigins?.includes("127.0.0.1"));
});
