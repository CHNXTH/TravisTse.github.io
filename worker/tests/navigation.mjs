import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/index.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const env={DEEPSEEK_API_KEY:'test',SITE_DATA:{get:async()=>JSON.stringify({})}};
const original=globalThis.fetch;
try {
 for(const targetId of ['experience:1','invalid']){
  globalThis.fetch=async(_url,options)=>{assert.equal(JSON.parse(options.body).response_format.type,'json_object');return Response.json({choices:[{message:{content:JSON.stringify({reply:'Answer experience:1',targetId})}}]})};
  const response=await worker.fetch(new Request('https://local/api/chat',{method:'POST',body:JSON.stringify({message:'工作经历',navigationTargets:[{id:'experience:1',label:'ByteDance'}]})}),env);
  const data=await response.json();assert.equal(response.status,200);assert.equal(data.reply,'Answer');assert.equal(data.targetId,targetId==='invalid'?null:targetId);
 }
 console.log('PASS structured navigation, target whitelist, internal IDs removed from answer');
}finally{globalThis.fetch=original}
