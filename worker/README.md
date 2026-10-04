# Cloudflare Worker Chat Proxy

This Worker keeps the DeepSeek API key on the server side and exposes a safe public endpoint for the GitHub Pages frontend.

## Local development

1. Install Wrangler:
   `npm install -g wrangler`
2. Start the Worker from this folder:
   `wrangler dev`

The Worker reads `DEEPSEEK_API_KEY` from `.dev.vars` during local development.

## Deploy

1. Authenticate:
   `wrangler login`
2. Add the production secret:
   `wrangler secret put DEEPSEEK_API_KEY`
3. Deploy:
   `wrangler deploy`

After deploy, copy the returned `https://<worker>.workers.dev` URL into `/chat-config.js`.

## Asset uploads (recommended)
This Worker supports uploading images (avatar, logos, project covers, social icons) to avoid the browser `localStorage` size limit.

1) Deploy Worker:
```bash
npx wrangler deploy
```

If the admin page shows `Upload endpoint not found`, it usually means the Worker was not re-deployed after code changes.

### Storage backend
By default, uploads are stored in Workers KV (the existing `SITE_DATA` namespace) under keys like `asset_img/...`.
This works even if R2 is not enabled on your Cloudflare account.

## Content storage safety (2026-10-05)

The frontend uses `site-storage.js` with the `travis-tse:v1:` prefix for both
local and session storage. It never imports/deletes the old shared `websiteData`
keys. GitHub project paths on the same origin are not storage boundaries.
The original shared cache may contain another site's data or unsaved drafts;
inspect/export it manually before any recovery. Do not clear it as a migration.

Published content is managed by one `ContentCoordinator` Durable Object. On
first access it copies the existing KV `website_content_v1` bytes to its SQLite
storage, retaining `migration:original-kv`. It never overwrites/deletes that
original KV record. Assets and authentication remain in the original KV namespace.
Every content write retains a transactional `backup:<time>:<uuid>` snapshot.
No retention deletion is enabled by this change.

Admin reads return a revision; saves must include that exact `expectedRevision`.
Concurrent/new messages invalidate stale editor snapshots; a 409 preserves the
server content and the frontend draft. The user must export their draft and
reload/reconcile before retrying. Opening the admin panel cannot publish data.
Only a confirmed cloud response means a save succeeded. Cache quota failures
fall back to page memory, so unsubmitted drafts should still be exported.

Anonymous submissions carry a stable request ID across retries and are serialized
with admin writes. A duplicate request returns the original receipt. The API
requires the coordinator binding for writes, failing closed if it is missing.

### Verification

Run from the repository root:

```sh
node tests/storage-isolation.cjs
node tests/admin-persistence.cjs
node worker/tests/storage.mjs
node worker/tests/knowledge.mjs
node worker/tests/navigation.mjs
# Requires Miniflare/workerd available in the Node resolution path:
node worker/tests/storage-runtime.cjs
```

`SITE_CONTENT_FIXTURE=/absolute/path/to/private-backup.json` optionally replays a
real backup in the local runtime test. The test never connects to production.
Never commit private snapshots or `.local-backups/`.

### Release and rollback

Deploy the Worker binding/migration and the matching frontend together. Old admin
pages cannot save without a revision and should be reloaded. Refresh/re-login is
required after frontend session isolation; no password has changed.
Before release, export a fresh authenticated KV backup, close old editing tabs,
and check for any externally running scripts that write directly to KV. After
release, compare every content section and count through the authenticated admin
API before performing edits. Existing records must be identical at cutover.

Do not blindly roll back to a pre-coordinator Worker after new writes: its KV
snapshot is intentionally frozen and would omit new content. Keep the coordinator
binding/storage in any rollback build, or first export the latest authenticated
content and reconcile it with KV under a controlled write pause. Never delete the
Durable Object, its migration, or the original KV during rollback.
