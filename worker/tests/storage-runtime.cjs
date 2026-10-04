// Runs against local workerd/SQLite only. Never connects to the production namespace.
const {Miniflare}=require('miniflare');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const mf=new Miniflare({modules:true,scriptPath:path.resolve('worker/src/index.js'),compatibilityDate:'2026-04-30',kvNamespaces:['SITE_DATA'],durableObjects:{CONTENT_COORDINATOR:{className:'ContentCoordinator',useSQLite:true}},bindings:{ADMIN_SESSION_SECRET:'local-runtime-test'}});
 try{
  const kv=await mf.getKVNamespace('SITE_DATA');
  const original=process.env.SITE_CONTENT_FIXTURE ? JSON.parse(fs.readFileSync(process.env.SITE_CONTENT_FIXTURE,'utf8')) : {profile:{nameEn:'Travis Tse'},footprints:[{id:'keep-footprint'}],anonymousMessages:[{id:'keep-message',message:'original'}],unknown:{keep:true},meta:{}};
  const raw=JSON.stringify(original);await kv.put('website_content_v1',raw);
  let response=await mf.dispatchFetch('http://local/api/content');assert.equal(response.status,200);const initial=(await response.json()).content; const expected=structuredClone(original);if(expected.settings){delete expected.settings.password;if(!Object.keys(expected.settings).length)delete expected.settings}assert.deepEqual(initial,expected);
  const results=await Promise.all(Array.from({length:8},(_,i)=>mf.dispatchFetch('http://local/api/anonymous-messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'runtime '+i,requestId:'runtime-request-000'+i})})));
  for(const r of results)assert.equal(r.status,200,await r.text());
  response=await mf.dispatchFetch('http://local/api/content');const after=(await response.json()).content;assert.equal(after.anonymousMessages.length,original.anonymousMessages.length+8);assert.deepEqual(after.footprints,original.footprints);assert.deepEqual(after.unknown,original.unknown);
  assert.equal(await kv.get('website_content_v1'),raw);
  console.log('PASS local workerd + SQLite: migration exact, concurrent writes preserved, original KV unchanged');
 }finally{await mf.dispose()}
})().catch(e=>{console.error(e);process.exitCode=1});
