const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('site-storage.js', 'utf8');
function nativeStorage() {
 const data = new Map();
 return { get length(){return data.size}, key:i=>[...data.keys()][i]??null, getItem:k=>data.get(k)??null, setItem:(k,v)=>data.set(k,String(v)), removeItem:k=>data.delete(k), data };
}
const local = nativeStorage(), session = nativeStorage();
local.setItem('websiteData', JSON.stringify({profile:{nameEn:'Cristy Fan'}}));
local.setItem('websiteData_backup_old','keep');session.setItem('cfAdminToken','other-site-session');
const context = {window:{localStorage:local,sessionStorage:session}};
vm.runInNewContext(source,context);
const own = context.window.travisStorage;
assert.equal(own.getItem('websiteData'),null);
assert.equal(context.window.travisSessionStorage.getItem('cfAdminToken'),null);
own.setItem('websiteData','Travis');
assert.equal(local.getItem('travis-tse:v1:websiteData'),'Travis');
assert.equal(JSON.parse(local.getItem('websiteData')).profile.nameEn,'Cristy Fan');
assert.equal(own.length,1);
assert.equal(own.key(0),'websiteData');
assert.notEqual(own.physicalKey('websiteData'),'websiteData');
local.setItem('websiteData','Cristy changes');assert.equal(own.getItem('websiteData'),'Travis');
own.removeItem('websiteData');assert.equal(local.getItem('websiteData'),'Cristy changes');
local.setItem = () => {throw new Error('quota')};own.setItem('websiteData','memory');assert.equal(own.getItem('websiteData'),'memory');assert.equal(own.persistent,false);
const blocked={window:{get localStorage(){throw new Error('blocked')},get sessionStorage(){throw new Error('blocked')}}};
vm.runInNewContext(source,blocked);blocked.window.travisStorage.setItem('websiteData','ok');assert.equal(blocked.window.travisStorage.getItem('websiteData'),'ok');
console.log('PASS shared-origin isolation, old data preserved, session isolation, quota/blocked storage fallback');
