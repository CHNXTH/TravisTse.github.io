const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('admin.js','utf8');
let saves=0,fail=false;
const storage={getItem:()=>null,setItem:()=>{},persistent:false};
const messages=[];
const context={structuredClone,console,Blob,Date,JSON,Promise,setTimeout:()=>{},window:{addEventListener:()=>{},travisStorage:storage,cloudflareApi:{getAdminToken:()=> 'test',getAdminContent:async()=>({content:{profile:{nameEn:'Travis Tse'},anonymousMessages:[],meta:{}},revision:'one'}),saveAdminContent:async content=>{saves++;if(fail)throw Error('conflict');return {content}}}},document:{addEventListener:()=>{},createElement:()=>({}),head:{appendChild:()=>{}}}};
vm.createContext(context);vm.runInContext(source,context);context.record=(m,t)=>messages.push({m,t});vm.runInContext('showMessage=record; createBackup=()=>{};',context);
(async()=>{
 await vm.runInContext('loadWebsiteData()',context);assert.equal(saves,0);
 vm.runInContext("websiteData.profile.nameZh='谢堂华'",context);
 assert.equal(await vm.runInContext('saveWebsiteData()',context),true);assert.equal(saves,1);assert(messages.some(x=>x.m.includes('Cloudflare')&&x.t==='success'));
 fail=true;vm.runInContext("websiteData.profile.summary='unsaved draft'",context);
 assert.equal(await vm.runInContext('saveWebsiteData()',context),false);assert.equal(vm.runInContext('websiteData.profile.summary',context),'unsaved draft');
 context.window.cloudflareApi.getAdminContent=async()=>{throw Error('network')};
 await vm.runInContext('loadWebsiteData()',context);const count=saves;
 assert.equal(await vm.runInContext('saveWebsiteData()',context),false);assert.equal(saves,count);
 console.log('PASS cloud save independent of persistent cache, no save on load, conflict preserves edit, failed cloud load blocks overwrite');
})().catch(e=>{console.error(e);process.exitCode=1});
