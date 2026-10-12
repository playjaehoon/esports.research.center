import { $, $$, tr, local, loadData, published, byDate, escapeHTML as e, safeURL, icon, emptyState, loadFailure } from './core.js';
export function publicationCard(item) {
  const link=(url,label)=>safeURL(url) ? `<a class="paper-link" href="${e(safeURL(url))}" target="_blank" rel="noopener noreferrer">${label} ${icon('external')}</a>` : '';
  return `<article class="publication-card" id="publication-${e(item.id)}"><div class="paper-meta"><span class="tag">${e(local(item.type)||tr('학술 논문','Publication'))}</span><span>${e(item.year)}</span></div><h3>${e(local(item.title))}</h3><p>${e(local(item.authors))}</p><p class="journal">${e(local(item.journal))}</p><div class="paper-links">${link(item.pdf,'PDF')}${link(item.doi,'DOI')}${!safeURL(item.pdf)&&!safeURL(item.doi) ? `<span class="muted">${tr('원문 링크 준비 중','Full-text link pending')}</span>`:''}</div></article>`;
}
export async function renderTracks() {
  const container=$('[data-tracks]'); if(!container) return;
  try {
    const tracks=await loadData('tracks');
    container.innerHTML=tracks.map(track=>`<a class="track-card" id="track-${e(track.id)}" href="research.html?track=${e(track.id)}#archive"><div class="track-top"><span>${e(track.number)}</span>${icon(track.icon)}</div><h3>${e(local(track.title))}</h3><p class="track-english">${e(track.subtitle)}</p><p class="track-description">${e(local(track.description))}</p><div class="track-bottom"><span>${e(local(track.topics).join(' · '))}</span>${icon('external')}</div></a>`).join('');
  } catch { loadFailure(container,renderTracks); }
}
renderTracks();document.addEventListener('languagechange',renderTracks);
let all=[], track='', anchorVisited=false;
const list=$('#research-list');
function render() {
  if(!list) return;
  const query=($('#research-search').value||'').trim().toLocaleLowerCase();
  const year=$('#year-filter').value;
  const items=all.filter(p=>(!year||String(p.year)===year)&&(!track||p.track===track)&&[local(p.title),local(p.authors),local(p.journal)].join(' ').toLocaleLowerCase().includes(query));
  $('#research-count').textContent=tr(`${items.length}건의 연구 실적`,`${items.length} research record${items.length===1?'':'s'}`);
  list.innerHTML=items.length ? items.map(publicationCard).join('') : emptyState('book',all.length ? tr('조건에 맞는 연구 실적이 없습니다','No matching research found') : tr('새로운 지식을 담을 공간','A space for new knowledge'),all.length ? tr('검색어 또는 필터를 변경해 주세요.','Try another keyword or filter.') : tr('학술 논문과 연구 과제를 정리하고 있습니다. 확인된 실적부터 이곳에 공개합니다.','We are preparing our publications and research projects. Verified records will be shared here.'));
  if(!anchorVisited && location.hash.startsWith('#publication-')){const target=document.getElementById(location.hash.slice(1));if(target){target.scrollIntoView?.({block:'center'});anchorVisited=true;}}
}
async function init() {
  if(!list) return;
  try {
    all=published(await loadData('publications')).sort(byDate);
    const years=[...new Set(all.map(p=>p.year))].sort((a,b)=>b-a);
    const old=$('#year-filter').value;
    $('#year-filter').innerHTML=`<option value="">${tr('모든 연도','All years')}</option>`+years.map(year=>`<option value="${e(year)}">${e(year)}</option>`).join('');
    $('#year-filter').value=old;
    const tracks=await loadData('tracks');
    $('#track-filter').innerHTML=`<option value="">${tr('모든 연구 트랙','All research tracks')}</option>`+tracks.map(t=>`<option value="${e(t.id)}">${e(local(t.title))}</option>`).join('');
    const desired=track||new URLSearchParams(location.search).get('track');
    track=tracks.some(t=>t.id===desired) ? desired : '';
    $('#track-filter').value=track;
    render();
  } catch { loadFailure(list,init); }
}
if(list) {
  $('#research-search').addEventListener('input',render);$('#year-filter').addEventListener('change',render);
  $('#track-filter').addEventListener('change',event=> {track=event.target.value;const url=new URL(location.href);track?url.searchParams.set('track',track):url.searchParams.delete('track');history.replaceState(null,'',url);render();});
  init();document.addEventListener('languagechange',init);
}
