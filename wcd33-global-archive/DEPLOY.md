# WCD-33 Global Archive — deploy

The main BONDING game build and demo server live in the **parent** repo: [../README.md](../README.md).

From the repo root you can run `npm run archive:deploy` and `npm run archive:tail` (after `cd wcd33-global-archive && npm install` once).

Prereqs: Cloudflare account, Wrangler logged in (`npx wrangler login`).

1. **KV** — Create a namespace and put its id in `wrangler.toml` (replace the `0000…` placeholder for `ARCHIVE_KV`).

   ```bash
   npx wrangler kv namespace create ARCHIVE_KV
   ```

2. **CORS** — Before public traffic, set exact browser origins (comma-separated, no wildcards). Use the dashboard **Variables** for the worker, or uncomment `[vars]` in `wrangler.toml`:

   `ARCHIVE_CORS_ALLOW` = e.g. `https://your.pages.dev,https://yourdomain.com`

   Empty = `Access-Control-Allow-Origin: *` (dev only).

3. **Deploy**

   ```bash
   npm run deploy
   ```

4. **Game client** — Set the Worker URL (no trailing slash), e.g. in the page before loading the bundle:

   `window.BONDING_ARCHIVE_URL = 'https://wcd33-soup-archive.<your>.workers.dev'`

5. **Verify** — Live logs and JSON security events:

   ```bash
   npm run tail
   ```

   Filter Workers logs for `service":"wcd33"` (CORS denials, rate limits). Adjust `[[ratelimits]]` in `wrangler.toml` if needed.

Optional: `npm run typecheck` before deploy.
