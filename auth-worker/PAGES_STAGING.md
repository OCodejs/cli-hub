# Cloudflare Pages staging

The CLI Hub staging host is isolated from the existing OCodeJS production services:

- Pages project: `ocodejs-cli-hub-staging`
- Host: https://ocodejs-cli-hub-staging.pages.dev
- D1 database: `ocodejs-cli-auth-staging` (APAC)
- D1 binding: `DB`
- No custom domain or DNS changes
- The Pages project is not connected to a production branch deployment.

## Same-origin auth

`functions/[[path]].js` sends `/health`, `/auth/*`, and `/api/*` to the existing auth Worker module. Other requests continue to the static Pages asset pipeline. HTML responses set `window.OCODE_AUTH_API` to the current Pages origin. This keeps the HttpOnly session cookie first-party in Safari.

The staging D1 migration `auth-worker/migrations/0001_init.sql` has been applied and the Pages deployment configuration has the `DB` binding in both preview and production environments.

## Required Pages environment variables

Set these in Cloudflare Dashboard → Workers & Pages → `ocodejs-cli-hub-staging` → Settings → Variables and Secrets. Add them to both Preview and Production environments:

- `SESSION_SECRET` — Secret; use a cryptographically random value of at least 48 bytes.
- `TOKEN_ENCRYPTION_KEY` — Secret; base64-encoded 32-byte random key.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` — optional until GitHub OAuth is enabled.

The Pages Function sets `APP_ORIGIN` from the exact active Pages request origin at runtime. This supports both the stable staging hostname and branch-preview hostnames without allowing cross-origin requests. PAT login remains unavailable until the two required secrets are entered. GitHub OAuth additionally requires a dedicated OAuth App whose callback URL is `https://ocodejs-cli-hub-staging.pages.dev/auth/github/callback`.

Do not copy secrets into GitHub files, commits, issue comments, or chat. Do not attach a custom domain or alter existing `app`, `mcp`, or auth Workers.
