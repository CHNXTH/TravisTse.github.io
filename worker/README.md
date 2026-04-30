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
