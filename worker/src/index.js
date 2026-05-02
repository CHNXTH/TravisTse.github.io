const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const CONTENT_KEY = 'website_content_v1';
const BACKUP_PREFIX = 'website_backup_';
// Admin session token TTL.
// Long-lived tokens are OK here because this is a single-user admin panel protected by a password,
// and tokens are stored in sessionStorage (cleared on browser close by default).
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function buildSystemPrompt(knowledgeText) {
    return `
You are Travis Tse's website AI assistant.

Your job is to answer like a polished personal-profile concierge for Travis, based only on the website knowledge provided below.

Rules
1. Use the website knowledge as your primary source of truth.
2. If the question is partly outside the website content, answer the part you can support and then clearly say the rest is not explicitly stated on Travis's page.
3. Do not invent employers, dates, degrees, awards, metrics, or personal preferences not grounded in the knowledge.
4. Keep answers natural, specific, and warm. Do not sound like a generic AI assistant.
5. Match the user's language. If the user writes in Chinese, answer in Chinese. If the user writes in English, answer in English.
6. Be concise by default. Give a focused answer first, and only expand when the user asks for more detail.
7. Do not use Markdown formatting symbols in the final answer. Do not use **bold**, headings with #, tables, or horizontal rules. Use plain sentences and simple lists only.
8. Use simple bullet points when helpful. Prefer the bullet character "•" (not "-" or "*") so it reads well.
9. When useful, recommend 2 to 4 specific sections, experiences, or projects from the website and explain briefly why each one matters.
10. If a relevant link exists in the knowledge, include it as a plain URL so it is clickable on the website.
11. Only output URLs that appear verbatim in the Website Knowledge. Do not create or guess new URLs.

Website Knowledge
${knowledgeText}
`.trim();
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(request),
            });
        }

        const url = new URL(request.url);

        if (url.pathname === '/api/chat') {
            return handleChat(request, env);
        }

        if (url.pathname === '/api/content') {
            return handlePublicContent(request, env);
        }

        if (url.pathname === '/api/admin/login') {
            return handleAdminLogin(request, env);
        }

        if (url.pathname === '/api/admin/content') {
            return handleAdminContent(request, env);
        }

        if (url.pathname === '/api/admin/upload') {
            return handleAdminUpload(request, env);
        }

        if (url.pathname === '/api/admin/knowledge/polish') {
            return handleKnowledgePolish(request, env);
        }

        if (url.pathname.startsWith('/assets/')) {
            return handleAssetGet(request, env, url.pathname.slice('/assets/'.length));
        }

        return jsonResponse(request, { error: 'Not found' }, 404);
    }
};

async function handleChat(request, env) {
    if (request.method !== 'POST') {
        return jsonResponse(request, { error: 'Method not allowed' }, 405, { 'Allow': 'POST, OPTIONS' });
    }

    if (!env.DEEPSEEK_API_KEY) {
        return jsonResponse(request, { error: 'Missing DEEPSEEK_API_KEY secret' }, 500);
    }

    const body = await safeJson(request);
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
        return jsonResponse(request, { error: 'Message is required' }, 400);
    }

    try {
        const content = await readWebsiteContent(env);
        const knowledgeText = buildKnowledgeForQuery(content, message);
        const systemPrompt = buildSystemPrompt(knowledgeText);

        const upstreamResponse = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-v4-flash',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 512,
                stream: false
            }),
        });

        const upstreamData = await upstreamResponse.json();
        if (!upstreamResponse.ok) {
            const upstreamError = upstreamData && upstreamData.error
                ? (upstreamData.error.message || upstreamData.error)
                : 'DeepSeek request failed';
            return jsonResponse(request, { error: upstreamError }, upstreamResponse.status);
        }

        const reply = sanitizeReply(extractReply(upstreamData));
        if (!reply) {
            return jsonResponse(request, { error: 'DeepSeek returned an empty response' }, 502);
        }

        return jsonResponse(request, { reply }, 200);
    } catch (error) {
        return jsonResponse(
            request,
            { error: error && error.message ? error.message : 'Unexpected Worker error' },
            500
        );
    }
}

async function handleKnowledgePolish(request, env) {
    const auth = await requireAdminAuth(request, env);
    if (!auth.ok) {
        return auth.response;
    }

    if (request.method !== 'POST') {
        return jsonResponse(request, { error: 'Method not allowed' }, 405, { Allow: 'POST, OPTIONS' });
    }

    if (!env.DEEPSEEK_API_KEY) {
        return jsonResponse(request, { error: 'Missing DEEPSEEK_API_KEY secret' }, 500);
    }

    const body = await safeJson(request);
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const summary = typeof body.summary === 'string' ? body.summary.trim() : '';

    const prompt = `
You are helping Travis Tse maintain a personal knowledge card used for website Q&A.

Task
Create a concise summary (80-200 Chinese characters if Chinese, or 40-120 English words if English) that captures the key facts and outcomes.
Also propose 3 to 8 tags (short phrases).

Output format (JSON only)
{"summary":"...","tags":["...","..."]}

Input
Title: ${title}
Existing summary: ${summary}
Full content: ${content}
`.trim();

    const upstreamResponse = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'deepseek-v4-flash',
            messages: [
                { role: 'system', content: 'You are a careful assistant that outputs strict JSON only.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 256,
            stream: false,
        }),
    });

    const upstreamData = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
        const upstreamError = upstreamData && upstreamData.error
            ? (upstreamData.error.message || upstreamData.error)
            : 'DeepSeek request failed';
        return jsonResponse(request, { error: upstreamError }, upstreamResponse.status);
    }

    const reply = extractReply(upstreamData);
    let parsed = null;
    try {
        parsed = JSON.parse(reply);
    } catch (_) {
        // Try to salvage JSON if wrapped with text.
        const m = reply && reply.match(/\{[\s\S]*\}/);
        if (m) {
            try { parsed = JSON.parse(m[0]); } catch (_) {}
        }
    }

    if (!parsed || typeof parsed.summary !== 'string' || !Array.isArray(parsed.tags)) {
        return jsonResponse(request, { error: 'AI returned invalid JSON' }, 502);
    }

    return jsonResponse(request, { summary: parsed.summary.trim(), tags: parsed.tags.filter(Boolean).slice(0, 12) }, 200);
}

function buildKnowledgeForQuery(content, userMessage) {
    const manualCards = content && Array.isArray(content.knowledgeCards) ? content.knowledgeCards : [];
    const enabledManualCards = manualCards.filter((c) => c && c.enabled !== false);

    // Automatically derived cards from the structured website content. This keeps RAG in sync
    // even when the user updates experience/projects/etc in the admin panel.
    const derivedCards = buildDerivedCardsFromContent(content);
    const enabledCards = [...enabledManualCards, ...derivedCards];

    // Base profile info is tiny and always useful.
    const profile = content && content.profile ? content.profile : {};
    const base = [
        'Profile',
        `• Name: ${(profile.nameEn || 'Travis Tse')}${profile.nameZh ? ' / ' + profile.nameZh : ''}`,
        profile.location ? `• Location: ${profile.location}` : '',
        profile.email ? `• Email: ${profile.email}` : '',
        profile.phone ? `• Phone: ${profile.phone}` : '',
    ].filter(Boolean).join('\n');

    if (enabledCards.length === 0) {
        return `${base}\n\nNotes\n• No knowledge cards are configured yet.`;
    }

    const q = String(userMessage || '').toLowerCase();
    const tokens = q.split(/[^a-z0-9\u4e00-\u9fff]+/).filter(Boolean).slice(0, 24);

    const scoreCard = (c) => {
        const title = String(c.title || '').toLowerCase();
        const tagArr = Array.isArray(c.tags) ? c.tags.filter(Boolean).map((t) => String(t).toLowerCase()) : [];
        const tags = tagArr.join(' ');
        const summary = String(c.summary || '').toLowerCase();
        let s = 0;

        // Chinese-friendly matching: reward when the query directly contains any tag/title phrase.
        // This avoids the "whole sentence as one token" issue for Chinese questions.
        for (const tg of tagArr) {
            if (tg && q.includes(tg)) s += 8;
        }
        if (title && q.includes(title)) s += 6;

        for (const t of tokens) {
            if (!t) continue;
            if (title.includes(t)) s += 4;
            if (tags.includes(t)) s += 3;
            if (summary.includes(t)) s += 2;
        }
        s += Math.min(6, Math.max(0, Number(c.priority || 0))) * 0.4;
        return s;
    };

    const ranked = enabledCards
        .map((c) => ({ c, s: scoreCard(c) }))
        .sort((a, b) => b.s - a.s);

    const top = ranked.filter((x) => x.s > 0).slice(0, 5).map((x) => x.c);
    const fallback = ranked.slice(0, 3).map((x) => x.c);
    const picked = top.length ? top : fallback;

    // "Need details" gate: only include full content when explicitly asked for specifics.
    const needDetails = /细节|具体|怎么|如何|负责|做了什么|做过什么|干了什么|结果|影响|指标|数据|难点|方案|实现|实现细节|细节是什么|what did|how did|details|specifically/i.test(userMessage || '');

    const blocks = picked.map((c, idx) => {
        const tags = Array.isArray(c.tags) ? c.tags : [];
        const links = Array.isArray(c.links) ? c.links : [];
        const parts = [
            `Card ${idx + 1}`,
            `• Title: ${String(c.title || '').trim()}`,
            tags.length ? `• Tags: ${tags.join(', ')}` : '',
            c.summary ? `• Summary: ${String(c.summary).trim()}` : '',
            needDetails && c.content ? `• Details: ${String(c.content).trim()}` : '',
            links.length ? `• Links: ${links.join(' ')}` : '',
        ].filter(Boolean);
        return parts.join('\n');
    }).join('\n\n');

    return `${base}\n\nRelevant Cards\n${blocks}`;
}

function buildDerivedCardsFromContent(content) {
    if (!content || typeof content !== 'object') return [];

    const cards = [];
    const pushCard = (card) => {
        if (!card || !card.title || (!card.summary && !card.content)) return;
        cards.push({
            id: card.id || `auto_${cards.length + 1}`,
            title: String(card.title || '').trim(),
            tags: Array.isArray(card.tags) ? card.tags.filter(Boolean) : [],
            summary: String(card.summary || '').trim(),
            content: String(card.content || '').trim(),
            links: Array.isArray(card.links) ? card.links.filter(Boolean) : [],
            lang: card.lang || '',
            priority: Number(card.priority || 0),
            enabled: true,
            updatedAt: content.meta && content.meta.lastModified ? content.meta.lastModified : '',
            _auto: true,
        });
    };

    // Profile (tiny, but helps routing)
    if (content.profile) {
        const p = content.profile;
        pushCard({
            id: 'auto_profile',
            title: 'Profile Overview',
            tags: ['profile', 'contact', 'about'],
            summary: [
                p.nameEn || p.nameZh ? `Name: ${(p.nameEn || '').trim()}${p.nameZh ? ' / ' + String(p.nameZh).trim() : ''}` : '',
                p.location ? `Location: ${String(p.location).trim()}` : '',
                p.email ? `Email: ${String(p.email).trim()}` : '',
                p.phone ? `Phone: ${String(p.phone).trim()}` : '',
            ].filter(Boolean).join(' · '),
            content: '',
            links: [],
            priority: 1,
        });
    }

    // Education
    const education = Array.isArray(content.education) ? content.education : [];
    education.forEach((e, idx) => {
        const title = e.school || `Education ${idx + 1}`;
        const summary = [e.meta, e.details, e.time, e.research, e.stats, e.awards].filter(Boolean).join(' | ');
        pushCard({
            id: `auto_edu_${e.id || idx + 1}`,
            title: `Education: ${title}`,
            tags: ['education', 'school'],
            summary: summary,
            content: '',
            links: [],
            priority: 0,
        });
    });

    // Work Experience
    const exp = Array.isArray(content.experience) ? content.experience : [];
    exp.forEach((x, idx) => {
        const company = x.company || `Experience ${idx + 1}`;
        const detailsText = Array.isArray(x.details) ? x.details.join(' ') : String(x.details || '');
        const summary = [x.meta, x.time].filter(Boolean).join(' | ');
        const companyLower = String(company || '').toLowerCase();
        const metaLower = String(x.meta || '').toLowerCase();
        const expTags = new Set(['experience', 'work', 'job']);

        // Basic keyword tags from company/meta to help routing.
        for (const w of String(company || '').split(/[^a-z0-9\u4e00-\u9fff]+/i)) {
            const t = String(w || '').trim();
            if (t) expTags.add(t);
        }
        for (const w of String(x.meta || '').split(/[^a-z0-9\u4e00-\u9fff]+/i)) {
            const t = String(w || '').trim();
            if (t) expTags.add(t);
        }

        // Internship hints (very common user query in Chinese).
        if (metaLower.includes('intern') || metaLower.includes('internship') || /\b(intern)\b/i.test(metaLower)) {
            expTags.add('intern');
            expTags.add('internship');
            expTags.add('实习');
        } else {
            // Still add "实习" lightly to improve recall without relying on exact meta phrasing.
            expTags.add('实习');
        }

        // Small bilingual alias map for common companies on the site (improves Chinese recall).
        if (companyLower.includes('nio')) {
            expTags.add('NIO');
            expTags.add('蔚来');
        }
        if (companyLower.includes('ikea')) {
            expTags.add('IKEA');
            expTags.add('宜家');
        }

        pushCard({
            id: `auto_exp_${x.id || idx + 1}`,
            title: `Work Experience: ${company}`,
            tags: Array.from(expTags),
            summary: summary,
            content: detailsText,
            links: [],
            priority: 0,
        });
    });

    // Projects
    const projects = Array.isArray(content.projects) ? content.projects : [];
    projects.forEach((p, idx) => {
        const title = p.title || `Project ${idx + 1}`;
        pushCard({
            id: `auto_project_${p.id || idx + 1}`,
            title: `Project: ${title}`,
            tags: ['project'],
            summary: p.link ? `Link: ${p.link}` : '',
            content: '',
            links: p.link ? [p.link] : [],
            priority: 0,
        });
    });

    // Papers
    const papers = Array.isArray(content.papers) ? content.papers : [];
    papers.forEach((p, idx) => {
        const title = p.title || `Paper ${idx + 1}`;
        const summary = [p.time, p.authors].filter(Boolean).join(' | ');
        const link = p.link ? String(p.link).trim() : '';
        pushCard({
            id: `auto_paper_${p.id || idx + 1}`,
            title: `Paper/Patent: ${title}`,
            tags: ['paper', 'patent', 'research'],
            summary,
            content: '',
            links: link ? [link] : [],
            priority: 0,
        });
    });

    // Awards
    const awards = Array.isArray(content.awards) ? content.awards : [];
    awards.forEach((a, idx) => {
        const title = a.title || `Award ${idx + 1}`;
        const summary = [a.time, a.details].filter(Boolean).join(' | ');
        pushCard({
            id: `auto_award_${a.id || idx + 1}`,
            title: `Award: ${title}`,
            tags: ['award'],
            summary,
            content: '',
            links: [],
            priority: 0,
        });
    });

    // Social links (help answer "how to contact")
    const social = Array.isArray(content.social) ? content.social : [];
    if (social.length) {
        const links = social.map((s) => s && s.link ? String(s.link).trim() : '').filter(Boolean);
        pushCard({
            id: 'auto_social',
            title: 'Connect Links',
            tags: ['contact', 'social'],
            summary: links.length ? `Links: ${links.slice(0, 8).join(' ')}` : '',
            content: '',
            links,
            priority: 0,
        });
    }

    return cards;
}

async function handlePublicContent(request, env) {
    if (request.method !== 'GET') {
        return jsonResponse(request, { error: 'Method not allowed' }, 405, { 'Allow': 'GET, OPTIONS' });
    }

    const content = await readWebsiteContent(env);
    if (!content) {
        return jsonResponse(request, { error: 'Content not initialized' }, 404);
    }

    return jsonResponse(request, {
        content: sanitizePublicContent(content)
    }, 200);
}

async function handleAdminLogin(request, env) {
    if (request.method !== 'POST') {
        return jsonResponse(request, { error: 'Method not allowed' }, 405, { 'Allow': 'POST, OPTIONS' });
    }

    if (!env.ADMIN_SESSION_SECRET) {
        return jsonResponse(request, { error: 'Missing ADMIN_SESSION_SECRET secret' }, 500);
    }

    const body = await safeJson(request);
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!password) {
        return jsonResponse(request, { error: 'Password is required' }, 400);
    }

    const content = await readWebsiteContent(env);
    const storedPassword = getStoredPassword(content, env);

    if (password !== storedPassword) {
        return jsonResponse(request, { error: 'Invalid password' }, 401);
    }

    const token = await createSessionToken(
        { scope: 'admin', exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
        env.ADMIN_SESSION_SECRET
    );

    return jsonResponse(request, {
        token,
        expiresIn: TOKEN_TTL_SECONDS
    }, 200);
}

async function handleAdminContent(request, env) {
    const auth = await requireAdminAuth(request, env);
    if (!auth.ok) {
        return auth.response;
    }

    if (request.method === 'GET') {
        const content = await readWebsiteContent(env);
        if (!content) {
            return jsonResponse(request, {
                content: null,
                bootstrapRequired: true
            }, 200);
        }

        return jsonResponse(request, {
            content,
            bootstrapRequired: false
        }, 200);
    }

    if (request.method !== 'PUT') {
        return jsonResponse(request, { error: 'Method not allowed' }, 405, { 'Allow': 'GET, PUT, OPTIONS' });
    }

    const body = await safeJson(request);
    const content = normalizeWebsiteContent(body.content);
    if (!content) {
        return jsonResponse(request, { error: 'Content payload is required' }, 400);
    }

    const previousContent = await readWebsiteContent(env);
    if (previousContent) {
        await env.SITE_DATA.put(`${BACKUP_PREFIX}${Date.now()}`, JSON.stringify(previousContent));
    }

    content.meta = content.meta || {};
    content.meta.version = content.meta.version || '2.0-cloudflare';
    content.meta.lastModified = new Date().toISOString();
    content.meta.savedBy = 'cloudflare-admin';

    await env.SITE_DATA.put(CONTENT_KEY, JSON.stringify(content));

    return jsonResponse(request, { success: true, content }, 200);
}

async function handleAdminUpload(request, env) {
    const auth = await requireAdminAuth(request, env);
    if (!auth.ok) {
        return auth.response;
    }

    if (request.method !== 'POST') {
        return jsonResponse(request, { error: 'Method not allowed' }, 405, { 'Allow': 'POST, OPTIONS' });
    }

    if (!env.SITE_DATA) {
        return jsonResponse(request, { error: 'Missing SITE_DATA binding' }, 500);
    }

    let form;
    try {
        form = await request.formData();
    } catch (e) {
        return jsonResponse(request, { error: 'Invalid form data' }, 400);
    }

    const file = form.get('file');
    if (!file || typeof file === 'string') {
        return jsonResponse(request, { error: 'Missing file' }, 400);
    }

    const contentType = file.type || 'application/octet-stream';
    if (!contentType.startsWith('image/')) {
        return jsonResponse(request, { error: 'Only image uploads are supported' }, 400);
    }

    const bytes = await file.arrayBuffer();
    const maxBytes = 8 * 1024 * 1024; // keep admin uploads reasonable
    if (bytes.byteLength > maxBytes) {
        return jsonResponse(request, { error: `File too large (max ${maxBytes} bytes)` }, 413);
    }

    const key = buildAssetKey(file.name || '', contentType);
    const base64 = arrayBufferToBase64(bytes);
    await env.SITE_DATA.put(`asset_${key}`, JSON.stringify({
        contentType,
        base64,
        size: bytes.byteLength,
        uploadedAt: new Date().toISOString()
    }));

    const origin = new URL(request.url).origin;
    return jsonResponse(request, {
        key,
        url: `${origin}/assets/${encodeURIComponent(key)}`,
        size: bytes.byteLength,
        contentType
    }, 200);
}

async function handleAssetGet(request, env, key) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return jsonResponse(request, { error: 'Method not allowed' }, 405, { 'Allow': 'GET, HEAD, OPTIONS' });
    }

    if (!env.SITE_DATA) {
        return jsonResponse(request, { error: 'Missing SITE_DATA binding' }, 500);
    }

    const decodedKey = safeDecodeURIComponent(key);
    if (!decodedKey) {
        return jsonResponse(request, { error: 'Invalid asset key' }, 400);
    }

    const raw = await env.SITE_DATA.get(`asset_${decodedKey}`);
    if (!raw) {
        return jsonResponse(request, { error: 'Asset not found' }, 404);
    }

    let record;
    try {
        record = JSON.parse(raw);
    } catch (e) {
        return jsonResponse(request, { error: 'Corrupted asset record' }, 500);
    }

    const contentType = record && typeof record.contentType === 'string' ? record.contentType : 'application/octet-stream';
    const base64 = record && typeof record.base64 === 'string' ? record.base64 : '';
    if (!base64) {
        return jsonResponse(request, { error: 'Corrupted asset record' }, 500);
    }

    const bytes = base64ToUint8Array(base64);
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    Object.entries(corsHeaders(request)).forEach(([k, v]) => headers.set(k, v));

    return new Response(request.method === 'HEAD' ? null : bytes, { status: 200, headers });
}

async function requireAdminAuth(request, env) {
    if (!env.ADMIN_SESSION_SECRET) {
        return {
            ok: false,
            response: jsonResponse(request, { error: 'Missing ADMIN_SESSION_SECRET secret' }, 500)
        };
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
        return {
            ok: false,
            response: jsonResponse(request, { error: 'Missing admin token' }, 401)
        };
    }

    const payload = await verifySessionToken(token, env.ADMIN_SESSION_SECRET);
    if (!payload || payload.scope !== 'admin') {
        return {
            ok: false,
            response: jsonResponse(request, { error: 'Invalid or expired admin token' }, 401)
        };
    }

    return { ok: true, payload };
}

function buildAssetKey(filename, contentType) {
    const safeName = String(filename || '').replace(/[^\w.\-]+/g, '_').slice(0, 80);
    const extFromName = safeName.includes('.') ? safeName.split('.').pop() : '';
    const extFromType = contentType.includes('/') ? contentType.split('/')[1] : '';
    const ext = (extFromName || extFromType || 'bin').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const rand = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `img/${Date.now()}-${rand}.${ext}`;
}

function safeDecodeURIComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch (e) {
        return '';
    }
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function readWebsiteContent(env) {
    if (!env.SITE_DATA) {
        return null;
    }

    const raw = await env.SITE_DATA.get(CONTENT_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function getStoredPassword(content, env) {
    if (content && content.settings && typeof content.settings.password === 'string' && content.settings.password.trim()) {
        return content.settings.password.trim();
    }

    return env.ADMIN_BOOTSTRAP_PASSWORD || '725500@20020303';
}

function sanitizePublicContent(content) {
    const cloned = structuredClone(content);
    delete cloned.settings;
    return cloned;
}

function normalizeWebsiteContent(content) {
    if (!content || typeof content !== 'object') {
        return null;
    }

    const normalized = structuredClone(content);
    normalized.profile = normalized.profile || {};
    normalized.education = Array.isArray(normalized.education) ? normalized.education : [];
    normalized.experience = Array.isArray(normalized.experience) ? normalized.experience : [];
    normalized.projects = Array.isArray(normalized.projects) ? normalized.projects : [];
    normalized.papers = Array.isArray(normalized.papers) ? normalized.papers : [];
    normalized.awards = Array.isArray(normalized.awards) ? normalized.awards : [];
    normalized.social = Array.isArray(normalized.social) ? normalized.social : [];
    normalized.footprints = Array.isArray(normalized.footprints) ? normalized.footprints : [];
    normalized.knowledgeCards = Array.isArray(normalized.knowledgeCards) ? normalized.knowledgeCards : [];
    normalized.settings = normalized.settings || {};
    normalized.meta = normalized.meta || {};
    return normalized;
}

async function safeJson(request) {
    try {
        return await request.json();
    } catch (error) {
        return {};
    }
}

function corsHeaders(request, extra = {}) {
    const origin = request.headers.get('Origin');

    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Vary': 'Origin',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...extra,
    };
}

function jsonResponse(request, payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(request, extraHeaders),
        },
    });
}

function extractReply(upstreamData) {
    const message = upstreamData &&
        upstreamData.choices &&
        upstreamData.choices[0] &&
        upstreamData.choices[0].message;

    if (!message) {
        return '';
    }

    if (typeof message.content === 'string') {
        return message.content.trim();
    }

    if (Array.isArray(message.content)) {
        return message.content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (part && typeof part.text === 'string') return part.text;
                if (part && typeof part.content === 'string') return part.content;
                return '';
            })
            .join('\n')
            .trim();
    }

    return '';
}

function sanitizeReply(reply) {
    return (reply || '')
        .replace(/\r\n/g, '\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/^---+$/gm, '')
        // Prefer the "•" bullet style (consistent with the website prompt).
        .replace(/^\s*\d+\.\s+/gm, '• ')
        // Remove stray numbering lines like "3." that sometimes appear at the end.
        .replace(/^\s*\d+\.\s*$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function createSessionToken(payload, secret) {
    const encoder = new TextEncoder();
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
    const signature = base64UrlEncode(signatureBuffer);

    return `${signingInput}.${signature}`;
}

async function verifySessionToken(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        base64UrlDecode(signature),
        encoder.encode(signingInput)
    );

    if (!isValid) {
        return null;
    }

    const payload = JSON.parse(base64UrlDecodeToString(encodedPayload));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
    }

    return payload;
}

function base64UrlEncode(input) {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlDecodeToString(input) {
    return new TextDecoder().decode(base64UrlDecode(input));
}
