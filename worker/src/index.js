const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const CONTENT_KEY = 'website_content_v1';
const BACKUP_PREFIX = 'website_backup_';
// Admin session token TTL.
// Long-lived tokens are OK here because this is a single-user admin panel protected by a password,
// and tokens are stored in sessionStorage (cleared on browser close by default).
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const SITE_KNOWLEDGE = `
Profile
- Name: Travis Tse / 谢堂华 Travis Tse
- Age shown on page: 24
- Phone: +86 13020264160
- Email: chnxth@gmail.com

Education
- City University of Hong Kong: MSc in Venture Creation, offer received, College of Innovation, QS 62.
- East China University of Science and Technology: Design (Intelligent Product Interaction Design), 2025.09-2028.06. Focus: intelligent product design, industrial design engineering, AIGC design, large model training, service design.
- Shandong Jianzhu University: Architecture (Green Building Design Direction), 2021.09-2025.06. GPA 3.91/5, Rank 2/159, National Scholarship and many national/provincial/university awards.

Work Experience
- NIO Headquarters (Shanghai), AI Product Manager for Intelligent Cockpit, 2025.10-2026.02. Work includes multimodal agents, proactive recommendation, travel memory video generation, in-cockpit AIGC, LLM latency optimization, RAG vehicle-manual Q&A, safety guardrails, QQ Music growth, karaoke algorithm evaluation, app ecosystem infrastructure, Android Auto/CarPlay integration, and user feedback analytics. Received full-time offer recommendation and internship rating A.
- IKEA China Digital Innovation Center, Product Manager and Interaction Designer, 2024.07-2024.12. Worked on Global Product Collage and Fastdesign, templates for 20 countries, panorama module, AI 2D-to-3D design prototype, AR shopping prototype, image segmentation training support, and multiple product optimizations.
- Smart Site360 Mini Program, Project Lead / Product Manager / UX Designer, 2024.05-2025.05. Integrated multimodal field research, GIS, LLMs, LDA topic modeling, and computer vision. Received provincial innovation project approval, software copyright, and invention patent application.
- Matconstruct Mini Program, Project Lead / Product Manager / UX Designer, 2023.05-2023.09. Focused on architecture-material education with interviews, personas, data visualization, AR material construction, and LLM-assisted specification Q&A.
- Google Cloud Build with AI, 2025.05. Explored GenAI opportunities, Vertex AI workflows, model evaluation, developer collaboration, and AI product upskilling.

Recent Projects
- MatConstruct-Architecture-Education-App
- System Service Design Project-Ancient Village Catalyst
- SmartSite360Architectural-design-research-APP
- Green building renovation design
- VR Workshop-Green Wisdom Inheritance and Innovation

Papers and Patents
- 2024.11: Research on Interactive Service System Design for Traditional Village Cultural Heritage under the Background of "Cultural Innovation", Travis Tse and Jiang Wang, 2024 Computational Design Academic Forum Annual Conference Proceedings, Tongji University Press.
- 2024.12: Intelligent Interactive Service Design Empowering Rural Cultural Revitalization, based on Sandefan Village cultural heritage resource reconstruction using grounded theory and topic modeling, Qingrun Award undergraduate thesis competition.
- 2024.06: A Mobile APP-based Urban Planning System, invention patent under review.
- 2025.02: SmartSite360 Data-assisted Decision-making System, software copyright.

Awards
- National Scholarship (1‰)
- First Prize in the VR Workshop for Science and Art Practice at the National University Student Art Exhibition and Performance
- Special Prize (2) and First Prize in the National College Student Green Building Design Competition
- Third Prize in the Qingrun Award National College Student Thesis Competition
- First, Second, and Third Prizes in the China Good Ideas National Digital Art Design Competition
- Second Prize (3) in the Future Designer National College Digital Art Design Competition
- Third Prize in the National College Student English Competition
`;

const SYSTEM_PROMPT = `
You are Travis Tse's website AI assistant.

Your job is to answer like a polished personal-profile concierge for Travis, based only on the website knowledge provided below.

Rules
1. Use the website knowledge as your primary source of truth.
2. If the user asks about Travis's background, experience, education, projects, awards, research, interests, or contact methods, answer with concrete details from the knowledge.
3. If the question is partly outside the website content, answer the part you can support and then clearly say the rest is not explicitly stated on Travis's page.
4. Do not invent employers, dates, degrees, awards, metrics, or personal preferences not grounded in the knowledge.
5. Keep answers natural, specific, and warm. Do not sound like a generic AI assistant.
6. When useful, summarize Travis as an AI product, design, and innovation-oriented profile spanning intelligent cockpit, digital product design, architecture, and AIGC.
7. Match the user's language. If the user writes in Chinese, answer in Chinese. If the user writes in English, answer in English.
8. When asked how to contact Travis, prefer the website contact info and mention that more links are available in the Connect section.
9. When asked for opinions like "Is Travis a good fit?", give a grounded, evidence-based answer using the website details rather than vague praise.
10. Be concise by default. Give a focused answer first, and only expand when the user asks for more detail.
11. Do not use Markdown formatting symbols in the final answer. Do not use **bold**, headings with #, tables, or horizontal rules. Use plain sentences and simple lists only.
12. Make the tone feel like a warm personal brand introduction: thoughtful, confident, interdisciplinary, and human.
13. If the user asks what they should read, where they should start, or what best represents Travis, recommend 2 to 4 specific sections, experiences, or projects from the website and explain briefly why each one matters.
14. For broad introduction questions, start with a short positioning sentence, then give a few concrete highlights.

Website Knowledge
${SITE_KNOWLEDGE}
`.trim();

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
        const upstreamResponse = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-v4-flash',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
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
