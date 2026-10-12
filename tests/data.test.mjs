import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCollection, isSafeReference, validateData } from '../scripts/validate-data.mjs';
test('all published data is valid',async()=>assert.deepEqual(await validateData(),[]));
test('duplicate notice identifiers are rejected',()=>{const record={id:'notice-1',title:'A',date:'2026-10-13',category:'notice',body:'A'};assert.ok(validateCollection('notices',[record,record]).some(x=>x.includes('duplicate')));});
test('nonexistent dates are rejected',()=>assert.ok(validateCollection('notices',[{id:'a',title:'A',date:'2026-02-30',category:'event',body:'A'}]).some(x=>x.includes('invalid date'))));
test('script and data URLs are rejected',()=>{for(const url of ['javascript:alert(1)','data:text/html,test','//evil.example/image.png','https://example.com\nmalformed'])assert.equal(isSafeReference(url),false);});
test('local assets and HTTPS references are accepted',()=>{for(const url of ['assets/images/logo.png','https://doi.org/10.1234/example','notices.html?notice=one'])assert.equal(isSafeReference(url),true);});
test('bilingual content requires both languages',()=>assert.ok(validateCollection('members',[{id:'person',name:{ko:'이름'},role:'Faculty'}]).some(x=>x.includes('needs ko and en'))));
