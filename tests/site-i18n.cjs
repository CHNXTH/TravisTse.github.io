const assert = require('node:assert/strict');
global.OpenCC = require('../vendor/opencc/cn2t.js');
require('../site-i18n.js');
const S=global.SiteI18n;
const records=[{id:'byte',company:'ByteDance',time:'2026.2 - 2026.5',logoPath:'byte.svg',details:['English'],i18n:{'zh-CN':{company:'字节跳动',details:['产品运营实习生']}}},{id:'nio',company:'NIO',time:'2025.10 - 2026.10',logoPath:'nio.svg'}];
const original=JSON.stringify(records);
for(const lang of ['en','zh-CN','zh-TW']) for(const record of [...records].reverse()) {
 const view=S.view('experience',record,lang);
 for(const key of ['id','time','logoPath']) assert.equal(view[key],record[key]);
}
assert.equal(S.view('experience',records[0],'zh-TW').company,'字節跳動');
assert.deepEqual(S.view('experience',records[0],'zh-TW').details,['產品運營實習生']);
assert.equal(S.view('experience',records[1],'zh-CN').company,'NIO');
assert.equal(S.view('experience',records[1],'zh-CN',false).company,'');
assert.equal(S.view('profile',{nameEn:'Travis Tse',nameZh:'谢堂华'},'zh-TW').nameEn,'謝堂華');
for(const [type,field] of [['education','school'],['papers','title'],['awards','title']]) {
 assert.equal(S.view(type,{[field]:'English',i18n:{'zh-CN':{[field]:'优秀设计'}}},'zh-TW')[field],'優秀設計');
}
assert.equal(JSON.stringify(records),original);
console.log('PASS: record identity, reorder safety, shared fields, independent English, all five modules, traditional conversion, missing translation fallback, no source mutation');
