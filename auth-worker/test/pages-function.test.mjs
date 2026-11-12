import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../../functions/[[path]].js", import.meta.url), "utf8");

test("Pages Functions routes auth endpoints through the same-origin Worker", () => {
  assert.match(source, /AUTH_ROUTE/);
  assert.match(source, /authWorker\.fetch\(request, env\)/);
  assert.match(source, /context\.next\(\)/);
});

test("Pages HTML configures the auth API to use the current origin", () => {
  assert.match(source, /window\.OCODE_AUTH_API = location\.origin/);
  assert.match(source, /contentType\.includes\("text\/html"\)/);
});
