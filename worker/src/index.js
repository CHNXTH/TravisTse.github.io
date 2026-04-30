const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
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

Social platforms shown on page
- Instagram
- Behance
- GitHub
- Pinterest
- YouTube
- Xiaohongshu / Rednote
- Douyin / TikTok China
- NetEase Music
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
                headers: corsHeaders(),
            });
        }

        const url = new URL(request.url);
        if (url.pathname !== '/api/chat') {
            return jsonResponse({ error: 'Not found' }, 404);
        }

        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405, {
                'Allow': 'POST, OPTIONS'
            });
        }

        if (!env.DEEPSEEK_API_KEY) {
            return jsonResponse({ error: 'Missing DEEPSEEK_API_KEY secret' }, 500);
        }

        let body;
        try {
            body = await request.json();
        } catch (error) {
            return jsonResponse({ error: 'Invalid JSON body' }, 400);
        }

        const message = typeof body.message === 'string' ? body.message.trim() : '';
        if (!message) {
            return jsonResponse({ error: 'Message is required' }, 400);
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
                        {
                            role: 'system',
                            content: SYSTEM_PROMPT
                        },
                        {
                            role: 'user',
                            content: message
                        }
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
                return jsonResponse({ error: upstreamError }, upstreamResponse.status);
            }

            const reply = sanitizeReply(extractReply(upstreamData));

            if (!reply) {
                return jsonResponse({ error: 'DeepSeek returned an empty response' }, 502);
            }

            return jsonResponse({ reply }, 200);
        } catch (error) {
            return jsonResponse(
                { error: error && error.message ? error.message : 'Unexpected Worker error' },
                500
            );
        }
    }
};

function corsHeaders(extra = {}) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...extra,
    };
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

function jsonResponse(payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(extraHeaders),
        },
    });
}
