// Offline DOM integration tests. No real browser, HTTP request or external form submission.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const bilingual=(ko,en)=>({ko,en});
const notices=[
  {id:'older-pinned',title:bilingual('상단 고정 안내','Pinned notice'),category:'notice',date:'2025-01-01',summary:'Pinned summary',body:bilingual('첫 번째 문단\n두 번째 문단','First paragraph\nSecond paragraph'),pinned:true},
  {id:'event-2026',title:bilingual('학술 교류 세미나','Research seminar'),category:'event',date:'2026-10-13',summary:'세미나 요약',body:'<img src=x onerror="alert(1)">'},
  {id:'press',title:'언론 인터뷰',category:'press',date:'2026-01-01',body:'Press text'},
  {id:'hidden-notice',title:'Secret notice',category:'notice',date:'2026-10-14',body:'Private',published:false}
];
const publications=[
  {id:'paper-new',title:bilingual('게임 문화 연구','Gaming culture'),year:2026,date:'2026-06-01',authors:bilingual('연구자 A','Author A'),journal:'Journal A',track:'culture',doi:'https://doi.org/10.1234/test',pdf:'assets/papers/test.pdf'},
  {id:'paper-old',title:'정책 연구',year:2025,date:'2025-01-01',authors:'Author B',journal:'Journal B',track:'ecosystem',pdf:'javascript:alert(1)'},
  {id:'paper-hidden',title:'Not published',year:2026,authors:'Private',journal:'Private',published:false}
];

async function boot(page,{fixtures={},query='',storage={},storageBlocked=false,failData=[],hostname='core.test'}={}){
  const html=await readFile(`${page}.html`,'utf8');
  const consoleErrors=[];const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>consoleErrors.push(error.message));
  const dom=new JSDOM(html,{url:`https://${hostname}/${page}.html${query}`,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window;const doc=w.document;const requests=[];
  w.AbortSignal=AbortSignal;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  if(storageBlocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage disabled');}});
  else for(const [key,value] of Object.entries(storage))w.localStorage.setItem(key,String(value));
  w.fetch=async url=>{
    requests.push(url);const name=String(url).match(/data\/([^/]+)\.json/)?.[1];
    if(!name)throw new Error('Unexpected network request');
    if(failData.includes(name))throw new Error('Offline');
    const value=name in fixtures?fixtures[name]:JSON.parse(await readFile(`data/${name}.json`,'utf8'));
    return {ok:true,status:200,json:async()=>structuredClone(value)};
  };
  const context=dom.getInternalVMContext();const modules=new Map();
  for(const file of (await readdir('js')).filter(x=>x.endsWith('.js'))){const id=`https://${hostname}/js/${file}`;modules.set(id,new vm.SourceTextModule(await readFile(`js/${file}`,'utf8'),{context,identifier:id}));}
  const scripts=[...doc.querySelectorAll('script[type="module"]')].map(s=>new URL(s.getAttribute('src'),w.location.href).href);
  const entry=new vm.SourceTextModule(scripts.map(id=>`import '${id}';`).join('\n'),{context,identifier:`https://${hostname}/entry.js`});
  await entry.link((specifier,ref)=>{const id=new URL(specifier,ref.identifier).href;const module=modules.get(id);if(!module)throw new Error(`Missing ${id}`);return module;});
  await entry.evaluate();
  const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setTimeout(resolve,5));};await flush();
  const input=(selector,value)=>{doc.querySelector(selector).value=value;doc.querySelector(selector).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const change=(selector,value)=>{doc.querySelector(selector).value=value;doc.querySelector(selector).dispatchEvent(new w.Event('change',{bubbles:true}));};
  const click=selector=>doc.querySelector(selector).click();
  return {w,doc,dom,requests,flush,input,change,click,errors:consoleErrors,close:()=>w.close(),core:modules.get(`https://${hostname}/js/core.js`).namespace};
}

test('all 8 pages initialize offline without script errors',async()=>{
  for(const page of ['index','about','research','notices','gallery','qna','success','404']){
    const app=await boot(page);assert.equal(app.doc.querySelectorAll('h1').length,1,page);assert.deepEqual(app.errors,[],page);app.close();
  }
});
test('home starts with honest empty states and exactly four real tracks',async()=>{
  const app=await boot('index',{fixtures:{partners:[]}});assert.equal(app.doc.querySelectorAll('.track-card').length,4);assert.match(app.doc.querySelector('#latest-notices').textContent,/준비/);assert.match(app.doc.querySelector('#latest-publications').textContent,/준비/);assert.equal(app.doc.querySelectorAll('.ticker').length,0);assert.equal(app.doc.querySelector('#welcome-dialog').open,true);app.close();
});
test('popup suppression is a true 24-hour expiry and closing restores scrolling',async()=>{
  let app=await boot('index');app.doc.querySelector('#hide-today').checked=true;const before=Date.now();app.click('#welcome-dialog [data-close]');const expiry=Number(app.w.localStorage.getItem('hufs-core-popup-until'));assert.ok(expiry>=before+86400000&&expiry<=Date.now()+86400000);assert.equal(app.doc.body.classList.contains('dialog-open'),false);app.close();
  app=await boot('index',{storage:{'hufs-core-popup-until':expiry}});assert.equal(app.doc.querySelector('#welcome-dialog').open,false);app.close();
  app=await boot('index',{storage:{'hufs-core-popup-until':Date.now()-1}});assert.equal(app.doc.querySelector('#welcome-dialog').open,true);app.close();
});
test('storage disabled does not break popup or language control',async()=>{
  const app=await boot('index',{storageBlocked:true});assert.equal(app.doc.querySelector('#welcome-dialog').open,true);app.click('#welcome-dialog [data-close]');app.click('[data-language="en"]');assert.equal(app.doc.documentElement.lang,'en');assert.match(app.doc.querySelector('h1').textContent,/Beyond the game/);app.close();
});
test('latest home previews cap at 3 notices and 2 publications and exclude drafts',async()=>{
  const app=await boot('index',{fixtures:{notices,publications}});assert.equal(app.doc.querySelectorAll('#latest-notices .notice-card').length,3);assert.equal(app.doc.querySelectorAll('#latest-publications .publication-card').length,2);assert.equal(app.doc.querySelector('#latest-notices [data-notice-id]').dataset.noticeId,'event-2026');assert.doesNotMatch(app.doc.querySelector('#latest-notices').textContent,/Secret/);app.close();
});
test('notice category, realtime keyword filtering and pinned ordering work together',async()=>{
  const app=await boot('notices',{fixtures:{notices}});assert.equal(app.doc.querySelector('.notice-card').dataset.noticeId,'older-pinned');app.click('[data-category="event"]');assert.equal(app.doc.querySelectorAll('.notice-card').length,1);app.input('#notice-search','nothing');assert.equal(app.doc.querySelectorAll('.notice-card').length,0);app.input('#notice-search','세미나');assert.equal(app.doc.querySelectorAll('.notice-card').length,1);app.close();
});
test('notice deep links open safely and closing removes the query parameter',async()=>{
  const app=await boot('notices',{fixtures:{notices},query:'?notice=event-2026'});assert.equal(app.doc.querySelector('#notice-dialog').open,true);assert.match(app.doc.querySelector('#notice-detail-body').textContent,/<img/);assert.equal(app.doc.querySelector('#notice-detail-body img'),null);app.click('#notice-dialog [data-close]');assert.equal(app.w.location.search,'');app.close();
});
test('research year, track and keyword filters compose; unsafe PDF links are omitted',async()=>{
  const app=await boot('research',{fixtures:{publications}});assert.equal(app.doc.querySelectorAll('.publication-card').length,2);assert.equal(app.doc.querySelector('a[href^="javascript:"]'),null);app.change('#year-filter','2026');assert.equal(app.doc.querySelectorAll('.publication-card').length,1);app.change('#track-filter','ecosystem');assert.equal(app.doc.querySelectorAll('.publication-card').length,0);app.change('#year-filter','2025');assert.equal(app.doc.querySelectorAll('.publication-card').length,1);app.input('#research-search','Author B');assert.equal(app.doc.querySelectorAll('.publication-card').length,1);app.input('#research-search','Author A');assert.equal(app.doc.querySelectorAll('.publication-card').length,0);app.close();
});
test('research track links initialize the selected filter',async()=>{
  const app=await boot('research',{fixtures:{publications},query:'?track=culture'});assert.equal(app.doc.querySelector('#track-filter').value,'culture');assert.equal(app.doc.querySelectorAll('.publication-card').length,1);app.close();
});
test('search combines notices, publications and researchers and provides direct links',async()=>{
  const members=[{id:'person-a',name:bilingual('세미나 연구자','Seminar researcher'),role:'Faculty',bio:'게임 연구'}];
  const app=await boot('about',{fixtures:{notices,publications,members}});app.click('[data-open-search]');await app.flush();app.input('#global-search','연구');assert.ok(app.doc.querySelectorAll('.search-result').length>=3);assert.ok(app.doc.querySelector('.search-result[href="about.html#member-person-a"]'));app.input('#global-search','Secret');assert.equal(app.doc.querySelectorAll('.search-result').length,0);app.input('#global-search','<img');assert.equal(app.doc.querySelector('#search-results img'),null);app.close();
});
test('search survives partial data failure and offers a retry',async()=>{
  const app=await boot('about',{failData:['publications']});app.click('[data-open-search]');await app.flush();assert.ok(app.doc.querySelector('#retry-search'));assert.equal(app.doc.querySelectorAll('.search-result').length,5);app.close();
});
test('data failures show retry states instead of false empty archives',async()=>{
  const app=await boot('notices',{failData:['notices']});assert.match(app.doc.querySelector('#notice-list').textContent,/불러오지 못했습니다/);assert.ok(app.doc.querySelector('#notice-list .retry'));app.close();
});
test('gallery lightbox navigates and updates accessible captions',async()=>{
  const gallery=[{id:'g1',title:'첫 사진',date:'2026-10-13',image:'assets/images/logo.png',alt:'첫 사진 설명'},{id:'g2',title:'둘째 사진',date:'2026-10-12',image:'assets/images/hufs_logo.png',alt:'둘째 사진 설명'}];
  const app=await boot('gallery',{fixtures:{gallery}});app.click('[data-gallery="0"]');assert.equal(app.doc.querySelector('#lightbox').open,true);assert.equal(app.doc.querySelector('#lightbox-image').alt,'첫 사진 설명');app.click('#lightbox-next');assert.equal(app.doc.querySelector('#lightbox-title').textContent,'둘째 사진');app.doc.querySelector('#lightbox').dispatchEvent(new app.w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert.equal(app.doc.querySelector('#lightbox-counter').textContent,'1 / 2');app.click('#lightbox [data-close]');assert.equal(app.doc.querySelector('#lightbox').open,false);app.close();
});
test('real partner data creates one accessible set and one inert visual copy',async()=>{
  const partners=[{id:'partner',name:'Test fixture partner',logo:'assets/images/logo.png',url:'https://example.org/'}];
  const app=await boot('index',{fixtures:{partners}});assert.equal(app.doc.querySelectorAll('.ticker-group').length,2);assert.equal(app.doc.querySelectorAll('.ticker-group[inert][aria-hidden="true"]').length,1);app.click('.ticker-toggle');assert.equal(app.doc.querySelector('.ticker').classList.contains('paused'),true);app.close();
});
test('mobile drawer state, dialog exclusivity and opener focus restoration are wired',async()=>{
  const app=await boot('about');app.doc.querySelector('#menu-toggle').focus();app.click('#menu-toggle');assert.equal(app.doc.querySelector('#menu-toggle').getAttribute('aria-expanded'),'true');app.click('#mobile-menu [data-close]');assert.equal(app.doc.querySelector('#menu-toggle').getAttribute('aria-expanded'),'false');assert.equal(app.doc.activeElement.id,'menu-toggle');app.click('#menu-toggle');app.click('[data-open-search]');assert.equal(app.doc.querySelectorAll('dialog[open]').length,1);await app.flush();app.close();
});
test('language toggle updates select options, FAQ and preserves typed form values',async()=>{
  const app=await boot('qna');app.input('#contact-name','Test User');app.click('[data-language="en"]');await app.flush();assert.equal(app.doc.querySelector('#contact-name').value,'Test User');assert.equal(app.doc.querySelector('#contact-topic option[value="research"]').textContent,'Research collaboration');assert.match(app.doc.querySelector('#faq-list').textContent,/What does the center study/);assert.equal(app.doc.documentElement.lang,'en');app.close();
});
test('contact form requires name, valid email, topic, message and consent',async()=>{
  const app=await boot('qna');const form=app.doc.querySelector('#contact-form');assert.equal(form.checkValidity(),false);app.input('#contact-name','Test');app.input('#contact-email','not-an-email');app.change('#contact-topic','research');app.input('#contact-message','This is a test message.');app.doc.querySelector('[name="privacy-consent"]').checked=true;assert.equal(form.checkValidity(),false);app.input('#contact-email','test@example.com');assert.equal(form.checkValidity(),true);assert.equal(form.getAttribute('data-netlify'),'true');assert.equal(form.getAttribute('action'),'/success.html');app.close();
});
test('local preview never submits a form or pretends it was received',async()=>{
  const app=await boot('qna',{hostname:'localhost'});const event=new app.w.Event('submit',{cancelable:true,bubbles:true});app.doc.querySelector('#contact-form').dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.match(app.doc.querySelector('#form-status').textContent,/전송하지 않습니다/);assert.equal(app.requests.every(url=>url.startsWith('data/')),true);app.close();
});


test('hero switches between the CORE layout and full banner without changing the message',async()=>{
  const app=await boot('index');const hero=app.doc.querySelector('#hero-carousel');const title=hero.querySelector('h1').textContent;
  app.click('.hero-next');assert.ok(hero.classList.contains('hero-photo-mode'));assert.equal(hero.querySelector('h1').textContent,title);assert.equal(hero.querySelector('.hero-count').textContent,'02 / 03');
  assert.equal(hero.querySelector('.hero-mobile-photo').hidden,false);assert.ok(hero.querySelector('.hero-mobile-photo').getAttribute('src').endsWith('hero-arena-sample.svg'));
  app.click('.hero-previous');assert.equal(hero.classList.contains('hero-photo-mode'),false);app.click('.hero-toggle');assert.equal(hero.querySelector('.hero-toggle').getAttribute('aria-pressed'),'true');
  assert.equal(hero.querySelector('.hero-mobile-photo').hidden,true);assert.equal(hero.querySelector('.hero-mobile-photo').hasAttribute('src'),false);
  app.close();
});
