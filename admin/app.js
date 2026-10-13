import { login, logout, getUser, handleAuthCallback, acceptInvite, updateUser, requestPasswordRecovery } from '@netlify/identity';
const $ = s => document.querySelector(s);
const local = ['localhost','127.0.0.1'].includes(location.hostname);
const titles = { members:'연구진', notices:'공지사항', gallery:'갤러리' };
const schemas = {
  members:[['name','이름','text',true],['role','직책','text',true],['affiliation','소속','text'],['bio','소개 / 약력','textarea'],['image','프로필 사진','image'],['url','외부 프로필 링크','url']],
  notices:[['title','제목','text',true],['date','게시일','date',true],['category','분류','select',true],['summary','요약','textarea'],['body','본문','textarea',true],['pinned','상단 고정','checkbox']],
  gallery:[['title','제목','text',true],['date','활동 날짜','date',true],['image','활동 사진','image',true],['alt','사진 설명 (대체 텍스트)','text',true],['description','활동 소개','textarea']]
};
let collection='members', items=[], revision='', editing=null, dirty=false, upload=null, objectURL='', callback=null, pending=null, busy=false, loadVersion=0, photoVersion=0, readingPhoto=false;
const bilingual = key => !['date','image','url','category','pinned'].includes(key);
const say = message => { $('#status').textContent=message; };
async function api(options={}) {
  const response=await fetch(`/.netlify/functions/admin-content?collection=${collection}`, { credentials:'same-origin', ...options });
  const result=await response.json(); if(!response.ok) throw new Error(result.error || '요청에 실패했습니다.'); return result;
}
function resetEditor() {
  if(objectURL) URL.revokeObjectURL(objectURL);
  objectURL='';upload=null;editing=null;dirty=false;pending=null;photoVersion++;readingPhoto=false;
  $('#editor').hidden=true;$('#editor-hint').hidden=false;
}
function mayLeave(){ return !dirty || window.confirm('저장하지 않은 편집 내용이 있습니다. 편집을 닫을까요?'); }
function renderList(){
  $('#entries').replaceChildren();
  if(!items.length){$('#entries').textContent='등록된 항목이 없습니다. 새 항목을 추가해 주세요.';return;}
  for(const item of items){const button=document.createElement('button');button.type='button';button.className='entry';button.setAttribute('aria-pressed',String(editing?.id===item.id));
    const name=document.createElement('strong');name.textContent=(item.name?.ko||item.title?.ko||item.title||item.name||item.id);
    const note=document.createElement('small');note.textContent=item.published===false?'비공개':'공개';button.append(name,note);button.addEventListener('click',()=>{if(mayLeave())edit(item);});$('#entries').append(button);
  }
}
async function load(){
  const version=++loadVersion;items=[];revision='';$('#new').disabled=true;renderList();
  try{const data=local?{items:await (await fetch(`/data/${collection}.json`)).json(),revision:'local'}:await api();if(version!==loadVersion)return;items=data.items;revision=data.revision;renderList();$('#new').disabled=false;}
  catch(error){if(version===loadVersion)say(error.message);}
}
function field(key,label,type,value,required=false){
  const wrap=document.createElement('label');wrap.textContent=label+(required?' *':'');
  const input=document.createElement(type==='textarea'?'textarea':type==='select'?'select':'input');input.name=key;input.required=required;
  if(type==='select'){for(const [v,t] of [['notice','공지'],['event','학술행사'],['press','언론보도']]){const opt=new Option(t,v);input.append(opt);}}
  else if(type!=='textarea')input.type=type;
  if(type==='checkbox'){wrap.className='check';input.checked=Boolean(value);}else input.value=value||'';
  if(['text','textarea'].includes(type))input.maxLength=10000;
  wrap.append(input);return wrap;
}
function edit(item=null){
  resetEditor();editing=item?structuredClone(item):{id:crypto.randomUUID(),published:true};
  $('#fields').replaceChildren();$('#editor').hidden=false;$('#editor-hint').hidden=true;
  const english=document.createElement('details');const summary=document.createElement('summary');summary.textContent='영문 내용 (비워두면 한국어 내용 사용)';english.append(summary);
  for(const [key,label,type,required] of schemas[collection]){
    if(type==='image'){
      const labelEl=field('photo',label,'file','');const input=labelEl.querySelector('input');input.accept='image/png,image/jpeg,image/webp';
      const note=document.createElement('small');note.className='field-note';note.textContent='JPG · PNG · WebP, 최대 2MB. 새 사진을 선택하지 않으면 기존 사진을 유지합니다.';
      const img=document.createElement('img');img.className='editor-picture';img.alt='선택한 사진';if(editing.image)img.src='/'+editing.image.replace(/^\//,'');else img.hidden=true;
      if(editing.image?.startsWith('https:'))img.src=editing.image;
      input.addEventListener('change',async()=>{const version=++photoVersion;readingPhoto=false;upload=null;pending=null;if(objectURL)URL.revokeObjectURL(objectURL);objectURL='';img.hidden=!editing.image;if(editing.image)img.src=editing.image.startsWith('https:')?editing.image:'/'+editing.image;const file=input.files[0];if(!file)return;
        if(file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){input.value='';say('2MB 이하의 JPG, PNG, WebP 파일을 선택해 주세요.');return;}
        readingPhoto=true;
        try{const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
        if(version!==photoVersion)return;upload={type:file.type,base64:encoded.split(',')[1]};objectURL=URL.createObjectURL(file);img.src=objectURL;img.hidden=false;dirty=true;
        }catch{if(version===photoVersion)say('사진을 읽지 못했습니다. 다시 선택해 주세요.');}finally{if(version===photoVersion)readingPhoto=false;}
      });$('#fields').append(labelEl,note,img);continue;
    }
    const value=editing[key];$('#fields').append(field(key,label,type,bilingual(key)?value?.ko||value:value,required));
    if(bilingual(key))english.append(field(key+'_en',label+' (EN)',type,value?.en||''));
  }
  $('#fields').append(english,field('published','사이트에 공개','checkbox',editing.published!==false));renderList();
  $('#editor-panel').scrollIntoView({block:'start',behavior:'smooth'});
}
function readForm(){
  if(readingPhoto)throw new Error('사진을 읽는 중입니다. 잠시 후 미리보기를 열어 주세요.');
  const form=new FormData($('#editor'));const item={...editing,published:form.has('published')};
  for(const [key,,type] of schemas[collection]){
    if(type==='image')continue;
    if(type==='checkbox')item[key]=form.has(key);
    else if(bilingual(key)){const ko=String(form.get(key)||'').trim();item[key]={ko,en:String(form.get(key+'_en')||'').trim()||ko};}
    else item[key]=String(form.get(key)||'').trim();
  }
  if(collection==='gallery'&&!item.image&&!upload)throw new Error('활동 사진을 선택해 주세요.');
  return item;
}
$('#editor').addEventListener('input',()=>{dirty=true;pending=null;});
$('#editor').addEventListener('submit',event=>{event.preventDefault();try{
  pending=readForm();const preview=$('#preview-content');preview.replaceChildren();
  if(objectURL||pending.image){const img=document.createElement('img');img.alt='게시 사진 미리보기';img.src=objectURL||(pending.image.startsWith('https:')?pending.image:'/'+pending.image);preview.append(img);}
  for(const [key,label,type] of schemas[collection]){if(type==='image'||!pending[key])continue;const p=document.createElement('p');p.textContent=`${label}: ${pending[key]?.ko||pending[key]}`;preview.append(p);}
  const visibility=document.createElement('p');visibility.textContent=pending.published?'사이트에 공개됩니다.':'사이트에서 숨김 처리됩니다.';preview.append(visibility);
  $('#publish').disabled=local;$('#preview').showModal();
}catch(error){say(error.message);}});
$('#close-preview').onclick=()=>$('#preview').close();
$('#publish').onclick=async()=>{if(!pending||local||busy)return;busy=true;$('#publish').disabled=true;try{
  const result=await api({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({collection,revision,item:pending,upload,create:!items.some(item=>item.id===pending.id)})});
  $('#preview').close();say(result.message);resetEditor();await load();
}catch(error){say(error.message);$('#preview').close();}finally{busy=false;$('#publish').disabled=local;}};
$('#new').onclick=()=>{if(mayLeave())edit();};$('#cancel').onclick=()=>{if(mayLeave()){resetEditor();renderList();}};
$('#refresh').onclick=()=>{if(mayLeave()){resetEditor();load();}};
for(const button of document.querySelectorAll('[data-collection]'))button.onclick=()=>{if(!mayLeave())return;resetEditor();collection=button.dataset.collection;$('#collection-title').textContent=titles[collection];document.querySelectorAll('[data-collection]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));load();};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
async function enter(){const user=await getUser();if(!user){$('#password-panel').hidden=true;$('#login-panel').hidden=false;return;}$('#login-panel').hidden=true;$('#password-panel').hidden=true;$('#logout').hidden=false;if(!user.roles?.includes('admin')){say('로그인되었습니다. 사이트 담당자에게 admin 권한을 요청해 주세요.');return;}$('#workspace').hidden=false;say(`${user.email} 계정으로 로그인했습니다.`);await load();}
$('#login-form').onsubmit=async event=>{event.preventDefault();const form=new FormData(event.target);try{await login(form.get('email'),form.get('password'));event.target.reset();await enter();}catch{say('로그인에 실패했습니다. 이메일·비밀번호와 초대 상태를 확인해 주세요.');}};
$('#logout').onclick=async()=>{if(!mayLeave())return;try{await logout();location.reload();}catch{say('로그아웃에 실패했습니다. 다시 시도해 주세요.');}};
$('#recover').onclick=async()=>{const input=$('#login-form [name=email]');if(!input.reportValidity())return;try{await requestPasswordRecovery(input.value);say('등록된 계정이라면 비밀번호 재설정 메일이 발송됩니다.');}catch{say('메일을 요청하지 못했습니다. 사이트 담당자에게 문의해 주세요.');}};
$('#password-form').onsubmit=async event=>{event.preventDefault();const form=new FormData(event.target);if(form.get('password')!==form.get('confirm')){say('비밀번호가 일치하지 않습니다.');return;}try{if(callback?.type==='invite')await acceptInvite(callback.token,form.get('password'));else await updateUser({password:form.get('password')});event.target.reset();callback=null;await enter();}catch{say('비밀번호를 설정하지 못했습니다. 초대 링크가 만료되었는지 확인해 주세요.');}};
async function start(){
  if(local){$('#login-panel').hidden=true;$('#workspace').hidden=false;say('로컬 미리보기입니다. 편집과 미리보기를 체험할 수 있으며 서버 저장·게시는 비활성화되어 있습니다.');await load();return;}
  try{callback=await handleAuthCallback();if(['invite','recovery'].includes(callback?.type)){$('#login-panel').hidden=true;$('#password-panel').hidden=false;return;}await enter();}catch{say('로그인 연결을 확인해 주세요. 초대 링크가 만료되었다면 새 초대를 요청하세요.');}
}
start();
