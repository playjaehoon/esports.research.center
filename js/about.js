import { $, tr, local, loadData, published, escapeHTML as e, safeURL, icon, emptyState, loadFailure } from './core.js';
const container=$('#members-list');let anchorVisited=false;
async function render(){
  try{
    const members=published(await loadData('members'));
    container.innerHTML=members.length?members.map(member=>`<article class="member-card" id="member-${e(member.id)}">${safeURL(member.image)?`<img class="member-photo" src="${e(safeURL(member.image))}" alt="${e(local(member.name))}" loading="lazy" width="400" height="440">`:`<div class="member-placeholder" aria-hidden="true">${icon('people')}</div>`}<div class="member-body"><span class="eyebrow">${e(local(member.role))}</span><h3>${e(local(member.name))}</h3><p>${e(local(member.affiliation))}</p><p>${e(local(member.bio))}</p>${safeURL(member.url)?`<a class="text-link" href="${e(safeURL(member.url))}" target="_blank" rel="noopener noreferrer">${tr('프로필 보기','View profile')}${icon('external')}</a>`:''}</div></article>`).join(''):emptyState('people',tr('함께 연구하는 사람들','People behind the research'),tr('교수진, 연구원, 학생연구원 소개를 준비하고 있습니다.','Profiles of our faculty, researchers and student researchers are being prepared.'));
    if(!anchorVisited && location.hash.startsWith('#member-')){const target=document.getElementById(location.hash.slice(1));if(target){target.scrollIntoView?.({block:'center'});anchorVisited=true;}}
    const site=await loadData('site');
    if(site.directorMessage){$('#director-message').textContent=local(site.directorMessage);}
  }catch{loadFailure(container,render);}
}
render();document.addEventListener('languagechange',render);
