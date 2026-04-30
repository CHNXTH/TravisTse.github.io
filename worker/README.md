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
