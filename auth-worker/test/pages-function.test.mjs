import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { onRequest } from "../../functions/[[path]].js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const secret = "test-session-secret-for-pages-contract";
const sessionId = "test-session-cookie-value";
const b64url = bytes => Buffer.from(bytes).toString("base64url");
async function hmac(value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function envWithDb(initialRow) {
  let row = initialRow;
  const updates = [];
  return {
    SESSION_SECRET: secret,
    TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    __updates: updates,
    __getRow: () => row,
    DB: {
      prepare(sql) {
        let values = [];
        return {
          bind(...args) { values = args; return this; },
          async first() { return row; },
          async run() {
            if (sql.startsWith("UPDATE auth_sessions")) {
              updates.push(values);
              row = { ...row, csrf_hash: values[0] };
            }
            return { success: true };
          }
        };
      }
    }
  };
}

test("Pages routes health requests through the auth Worker", async () => {
  const response = await onRequest({
    request: new Request("https://preview.pages.dev/health"),
    env: {},
    next: async () => { throw new Error("static asset pipeline must not run"); }
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, "ocodejs-auth-worker");
});

test("Pages safely supplies Origin for same-origin GET requests without Origin", async () => {
  const response = await onRequest({
    request: new Request("https://preview.pages.dev/api/github/user"),
    env: envWithDb(null),
    next: async () => { throw new Error("auth route must not reach static assets"); }
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "not_authenticated" });
});

test("session reads migrate legacy CSRF hashes and stay stable across tabs", async () => {
  const legacyHash = await hmac("legacy-random-csrf-token");
  const row = {
    id_hash: await hmac(sessionId),
    github_id: "123",
    csrf_hash: legacyHash,
    expires_at: Date.now() + 60_000,
    github_login: "ocodejs-test",
    token_ciphertext: "unused",
    token_kind: "pat",
    scopes: "[]"
  };
  const env = envWithDb(row);
  const readSession = () => onRequest({
    request: new Request("https://preview.pages.dev/auth/session", {
      headers: { Cookie: "ocode_session=" + sessionId }
    }),
    env,
    next: async () => { throw new Error("auth route must not reach static assets"); }
  });
  const first = await (await readSession()).json();
  const second = await (await readSession()).json();
  assert.equal(first.connected, true);
  assert.equal(first.csrfToken, second.csrfToken);
  assert.equal(first.csrfToken, await hmac("csrf:" + sessionId));
  assert.equal(env.__updates.length, 1);
  assert.equal(env.__getRow().csrf_hash, await hmac(first.csrfToken));
});

test("HTML responses receive the active Pages origin configuration", async () => {
  const response = await onRequest({
    request: new Request("https://preview.pages.dev/"),
    env: {},
    next: async () => new Response("<html><head></head><body>ok</body></html>", {
      headers: { "content-type": "text/html; charset=utf-8" }
    })
  });
  assert.match(await response.text(), /window\.OCODE_AUTH_API = location\.origin/);
});

test("conditional HTML requests preserve bodyless 304 responses", async () => {
  const original = new Response(null, {
    status: 304,
    headers: { "content-type": "text/html; charset=utf-8", etag: '"cached"' }
  });
  const response = await onRequest({
    request: new Request("https://preview.pages.dev/"),
    env: {},
    next: async () => original
  });
  assert.equal(response.status, 304);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("etag"), '"cached"');
});

test("cross-site auth requests are rejected before reaching the Worker", async () => {
  const response = await onRequest({
    request: new Request("https://preview.pages.dev/auth/logout", {
      method: "POST",
      headers: { Origin: "https://attacker.example", "Sec-Fetch-Site": "cross-site" }
    }),
    env: {},
    next: async () => { throw new Error("auth route must not reach static assets"); }
  });
  assert.equal(response.status, 403);
});

test("GitHub OAuth callback permits cross-site top-level GET navigation", async () => {
  const response = await onRequest({
    request: new Request("https://preview.pages.dev/auth/github/callback?error=access_denied", {
      headers: { Origin: "https://github.com", "Sec-Fetch-Site": "cross-site" }
    }),
    env: {},
    next: async () => { throw new Error("auth route must not reach static assets"); }
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://preview.pages.dev/?auth=cancelled");
});
