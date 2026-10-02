import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
const { default: worker, buildWebsiteKnowledge } = await import('data:text/javascript;base64,' + Buffer.from(source + '\nexport { buildWebsiteKnowledge };').toString('base64'));
const content = {
  profile: { nameEn: 'PROFILE', summaryZh: '简介完整内容', avatar: 'PRIVATE_IMAGE' },
  education: [{ school: 'EDUCATION', details: 'EDUCATION_DETAILS' }],
  experience: [{ company: 'NEW_UNKNOWN_COMPANY', details: ['NEW_WORK_DETAIL'] }],
  projects: [{ title: 'PROJECT', description: 'PROJECT_DETAIL', link: 'https://example.com/project' }],
  papers: [{ title: 'PAPER', abstract: 'PAPER_DETAIL' }],
  awards: [{ title: 'AWARD', details: 'AWARD_DETAIL' }],
  knowledgeCards: [{ title: 'LIBRARY', content: 'LIBRARY_DETAIL' }, { title: 'DISABLED_SECRET', enabled: false }],
  footprints: [{ place: { city: 'FOOTPRINT_CITY', lat: 31 }, description: 'FOOTPRINT_DETAIL' }],
  anonymousMessages: [
    { message: 'PUBLIC_VISITOR_MESSAGE', isVisible: true, isFeatured: true },
    { message: 'PENDING_SECRET', isVisible: false, isFeatured: false },
    { message: 'HIDDEN_FEATURED_SECRET', isVisible: false, isFeatured: true },
    { message: 'UNFEATURED_SECRET', isVisible: true, isFeatured: false }
  ],
  social: [{ name: 'SOCIAL', link: 'https://example.com/social' }],
  settings: { password: 'PASSWORD_SECRET' }
};
const snapshot = buildWebsiteKnowledge(content);
for (const expected of ['PROFILE', '简介完整内容', 'EDUCATION_DETAILS', 'NEW_WORK_DETAIL', 'PROJECT_DETAIL', 'PAPER_DETAIL', 'AWARD_DETAIL', 'LIBRARY_DETAIL', 'FOOTPRINT_DETAIL', 'PUBLIC_VISITOR_MESSAGE', 'https://example.com/social']) assert(snapshot.includes(expected), expected);
for (const hidden of ['PRIVATE_IMAGE', 'DISABLED_SECRET', 'PENDING_SECRET', 'HIDDEN_FEATURED_SECRET', 'UNFEATURED_SECRET', 'PASSWORD_SECRET']) assert(!snapshot.includes(hidden), hidden);
let prompt;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, options) => {
  prompt = JSON.parse(options.body).messages[0].content;
  return Response.json({ choices: [{ message: { content: 'test answer' } }] });
};
const env = { DEEPSEEK_API_KEY: 'local-test', SITE_DATA: { get: async () => JSON.stringify(content) } };
const chat = async () => {
  const response = await worker.fetch(new Request('https://local/api/chat', { method: 'POST', body: JSON.stringify({ message: '这家新公司做了什么？' }) }), env);
  assert.equal(response.status, 200);
};
try {
  await chat(); assert(prompt.includes('NEW_WORK_DETAIL'));
  content.experience[0].details = ['UPDATED_WITHOUT_REDEPLOY'];
  content.projects.push({ title: 'NEW_PROJECT_WITHOUT_REDEPLOY' });
  await chat(); assert(prompt.includes('UPDATED_WITHOUT_REDEPLOY')); assert(!prompt.includes('NEW_WORK_DETAIL')); assert(prompt.includes('NEW_PROJECT_WITHOUT_REDEPLOY'));
  content.experience = [];
  await chat(); assert(!prompt.includes('UPDATED_WITHOUT_REDEPLOY'));
} finally { globalThis.fetch = originalFetch; }
console.log('PASS all ten modules, full details, privacy filters, live edits/additions/deletions without redeploy');
