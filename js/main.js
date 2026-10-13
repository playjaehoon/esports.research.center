// Identity invitation/recovery links may initially land on the public home page.
if (/^#(?:invite_token|recovery_token|confirmation_token|email_change_token)=/.test(location.hash)) location.replace('/admin/' + location.hash);
import { $, $$, tr, local, lang, setLanguage, loadData, published, safeURL, escapeHTML as e, icon, openDialog, closeDialog, bindDialog } from './core.js';
$$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
$$('dialog').forEach(bindDialog);
$$('[data-language]').forEach(button => button.addEventListener('click',()=>setLanguage(button.dataset.language)));
setLanguage(lang);
const menu = $('#mobile-menu');
const toggle = $('#menu-toggle');
toggle?.addEventListener('click',()=> { openDialog(menu); toggle.setAttribute('aria-expanded','true'); });
menu?.addEventListener('close',()=> toggle.setAttribute('aria-expanded','false'));
$$('a',menu || document.createElement('div')).forEach(a=>a.addEventListener('click',()=>closeDialog(menu)));
matchMedia('(min-width: 1100px)').addEventListener('change',event=> { if(event.matches) closeDialog(menu); });
$$('[data-year]').forEach(el=>el.textContent = new Date().getFullYear());

export const siteReady = loadData('site');
async function renderSite() {
  try {
    const site = await siteReady;
    $$('[data-address]').forEach(el=>el.textContent=local(site.address));
    $$('[data-room]').forEach(el=>el.textContent=local(site.room) || tr('상세 연구동·호실 안내 준비 중','Building and room details to be announced'));
    $$('[data-contact]').forEach(el=> {
      el.replaceChildren();
      if(site.email) { const a=document.createElement('a');a.href=`mailto:${site.email}`;a.textContent=(el.closest('.site-footer') ? 'E-mail: ' : '')+site.email;el.append(a); }
      if(site.phone) { const a=document.createElement('a');a.href=`tel:${site.phone.replace(/[^\d+]/g,'')}`;a.textContent=(el.closest('.site-footer') ? 'Tel: ' : '')+site.phone;el.append(a); }
      if(!site.email && !site.phone) el.textContent=tr('연구실 전화·이메일 등록 준비 중','Lab phone and email to be announced');
    });
    $$('[data-related-links]').forEach(el=>el.innerHTML=(site.relatedLinks||[]).filter(x=>safeURL(x.url)).map(x=>`<a href="${e(safeURL(x.url))}" target="_blank" rel="noopener noreferrer">${e(local(x.name))}${icon('external')}</a>`).join(''));
  } catch { /* Static institutional information remains available. */ }
}
renderSite();document.addEventListener('languagechange',renderSite);

async function renderPartners() {
  const container=$('#partners-content'); if(!container) return;
  try {
    const partners=published(await loadData('partners'));
    if(!partners.length) {
      container.innerHTML=`<div class="partners-waiting"><a href="https://www.hufs.ac.kr/" target="_blank" rel="noopener noreferrer"><img src="assets/images/hufs_logo.png" alt="${tr('한국외국어대학교','Hankuk University of Foreign Studies')}" width="207" height="50" loading="lazy"></a><span>${tr('연구의 가능성을 넓히는 열린 협력','Open collaboration. Shared possibilities.')}<small>${tr('협력기관 정보 등록 준비 중','Partner announcements coming soon')}</small></span><a class="text-link" href="qna.html#contact">${tr('협력 제안하기','Collaborate with us')} ${icon('arrow')}</a></div>`;
      return;
    }
    const items=[{name:{ko:'한국외국어대학교',en:'HUFS'},logo:'assets/images/hufs_logo.png',url:'https://www.hufs.ac.kr/'},...partners];
    const markup=items.filter(x=>safeURL(x.logo)).map(p=>`<a href="${e(safeURL(p.url)||'qna.html')}" target="_blank" rel="noopener noreferrer"><img src="${e(safeURL(p.logo))}" alt="${e(local(p.name))}" loading="lazy" width="180" height="60"></a>`).join('');
    container.innerHTML=`<div class="ticker"><div class="ticker-track"><div class="ticker-group">${markup}</div><div class="ticker-group" aria-hidden="true" inert>${markup}</div></div></div><button class="ticker-toggle text-link" aria-pressed="false">${tr('로고 움직임 일시정지','Pause logo animation')}</button>`;
    $('.ticker-toggle',container).addEventListener('click',event=> {
      const paused=$('.ticker',container).classList.toggle('paused');
      event.currentTarget.setAttribute('aria-pressed',String(paused));
      event.currentTarget.textContent=paused ? tr('로고 움직임 재생','Resume logo animation') : tr('로고 움직임 일시정지','Pause logo animation');
    });
  } catch { container.textContent=tr('협력기관 정보를 불러오지 못했습니다.','Partner information is temporarily unavailable.'); }
}
renderPartners();document.addEventListener('languagechange',renderPartners);
