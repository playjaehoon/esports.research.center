import { $, $$, tr, local, lang, loadData, published, byDate, escapeHTML as e, dateLabel, icon, emptyState, loadFailure, openDialog } from './core.js';
export const categoryName = value => ({notice:tr('공지','Notice'),event:tr('학술행사','Academic event'),press:tr('언론보도','In the media')})[value] || tr('공지','Notice');
export function noticeCard(item,preview=false) {
  return `<button class="notice-card ${preview?'preview':''}" data-notice-id="${e(item.id)}"><div class="notice-meta"><span class="tag">${e(categoryName(item.category))}</span>${item.pinned?`<span class="pinned">${tr('고정','Pinned')}</span>`:''}<time datetime="${e(item.date)}">${e(dateLabel(item.date))}</time></div><h3>${e(local(item.title))}</h3>${preview?`<p>${e(local(item.summary))}</p>`:''}<span class="notice-arrow">${icon('external')}</span></button>`;
}
export function showNotice(item) {
  const dialog=$('#notice-dialog');if(!dialog)return;
  $('#notice-detail-meta').textContent=`${categoryName(item.category)} · ${dateLabel(item.date)}`;
  $('#notice-detail-title').textContent=local(item.title);
  const body=local(item.body)||local(item.summary);
  $('#notice-detail-body').replaceChildren(...String(body).split('\n').filter(Boolean).map(text=> {const p=document.createElement('p');p.textContent=text;return p;}));
  dialog.dataset.noticeId=item.id;openDialog(dialog);
}
export function bindNoticeCards(container,items) {
  $$('[data-notice-id]',container).forEach(button=>button.addEventListener('click',()=> {
    const item=items.find(n=>n.id===button.dataset.noticeId);if(!item)return;
    const url=new URL(location.href);url.searchParams.set('notice',item.id);history.replaceState(null,'',url);showNotice(item);
  }));
}
let all=[],category='all';const list=$('#notice-list');
function render() {
  const query=$('#notice-search').value.trim().toLocaleLowerCase();
  const items=all.filter(item=>(category==='all'||item.category===category)&&[local(item.title),local(item.summary),local(item.body)].join(' ').toLocaleLowerCase().includes(query));
  $('#notice-count').textContent=tr(`총 ${items.length}건`,`${items.length} notice${items.length===1?'':'s'}`);
  list.innerHTML=items.length ? items.map(item=>noticeCard(item)).join('') : emptyState('notice',all.length?tr('검색 결과가 없습니다','No matching notices'):tr('센터의 다음 소식을 준비합니다','Our next chapter is on its way'),all.length?tr('다른 검색어나 카테고리를 선택해 주세요.','Try a different keyword or category.'):tr('학술행사, 모집 및 연구센터의 새로운 소식을 이곳에서 전합니다.','Academic events, opportunities and updates from the center will appear here.'));
  bindNoticeCards(list,items);
}
async function init() {
  if(!list)return;
  try {all=published(await loadData('notices')).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||byDate(a,b));render();
    const current=new URLSearchParams(location.search).get('notice');const item=all.find(n=>n.id===current);if(item)showNotice(item);
  } catch {loadFailure(list,init);}
}
if(list){
  $('#notice-search').addEventListener('input',render);
  $$('[data-category]').forEach(button=>button.addEventListener('click',()=> {category=button.dataset.category;$$('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
  init();document.addEventListener('languagechange',init);
}
$('#notice-dialog')?.addEventListener('close',()=> {const url=new URL(location.href);url.searchParams.delete('notice');history.replaceState(null,'',url);});
// Home previews share the same detail dialog; keep an open notice bilingual too.
if(!list)document.addEventListener('languagechange',async()=>{
  const dialog=$('#notice-dialog');if(!dialog?.open)return;
  try{const item=published(await loadData('notices')).find(n=>n.id===dialog.dataset.noticeId);if(item)showNotice(item);}catch{/* Existing readable detail remains visible. */}
});
