export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export let lang = 'ko';
try { lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('core-language') || 'ko'; } catch { /* Storage is optional. */ }
if (!['ko','en'].includes(lang)) lang = 'ko';
export const tr = (ko, en) => lang === 'en' ? en : ko;
export const local = value => typeof value === 'object' && value !== null ? value[lang] || value.ko || value.en || '' : value || '';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function safeURL(value) {
  if (!value || typeof value !== 'string') return '';
  try { const url = new URL(value, location.href); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function setLanguage(value) {
  lang = value === 'en' ? 'en' : 'ko';
  try { localStorage.setItem('core-language', lang); } catch { /* Storage is optional. */ }
  document.documentElement.lang = lang;
  $$('[data-ko][data-en]').forEach(el => { el.textContent = el.dataset[lang]; });
  $$('[data-placeholder-ko]').forEach(el => { el.placeholder = el.dataset[`placeholder${lang === 'ko' ? 'Ko' : 'En'}`]; });
  $$('[data-label-ko]').forEach(el => { el.setAttribute('aria-label', el.dataset[`label${lang === 'ko' ? 'Ko' : 'En'}`]); });
  $$('[data-language]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.language === lang)));
  const title = $('meta[name="page-title"]');
  if (title) document.title = `${title.dataset[lang]} | HUFS Global CORE`;
  document.dispatchEvent(new CustomEvent('languagechange'));
}
const cache = new Map();
export function loadData(name) {
  if (!cache.has(name)) {
    cache.set(name, (async () => {
      const response = await fetch(`data/${name}.json`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`Failed to load ${name}: ${response.status}`);
      return response.json();
    })().catch(error => { cache.delete(name); throw error; }));
  }
  return cache.get(name);
}
export const published = data => Array.isArray(data) ? data.filter(item => item.published !== false) : [];
export const byDate = (a,b) => String(b.date || b.year || '').localeCompare(String(a.date || a.year || ''));
export function dateLabel(date) {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-GB', { year:'numeric', month:'short', day:'numeric', timeZone:'Asia/Seoul' }).format(parsed);
}
const shapes = {
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>', external:'<path d="M7 17 17 7M7 7h10v10"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  activity:'<path d="M2 12h4l3-8 5 16 3-8h5"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>',
  spark:'<path d="m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8Z"/>',
  book:'<path d="M4 3h12l4 4v14H4ZM15 3v5h5M8 12h8M8 16h6"/>',
  notice:'<path d="M5 9v7h4l9 4V4L9 9Zm4 7 2 6M21 9v7"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 6"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  check:'<path d="m5 12 4 4L19 6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus:'<path d="M5 12h14M12 5v14"/>'
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.arrow}</svg>`;
export function emptyState(type, title, description, compact = false) {
  return `<div class="empty-state ${compact ? 'compact' : ''}"><span class="empty-icon">${icon(type)}</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p></div>`;
}
export function loadFailure(target, retry) {
  target.innerHTML = emptyState('notice', tr('자료를 불러오지 못했습니다','Unable to load content'), tr('연결을 확인한 후 다시 시도해 주세요.','Please check your connection and try again.')) + `<button class="button secondary retry">${tr('다시 시도','Try again')}</button>`;
  $('.retry',target).addEventListener('click',retry);
}
const returnFocus = new WeakMap();
export function openDialog(dialog) {
  if (dialog.open) return;
  $$('dialog[open]').forEach(closeDialog);
  returnFocus.set(dialog, document.activeElement);
  dialog.showModal();
  document.body.classList.add('dialog-open');
}
export function closeDialog(dialog) { if (dialog.open) dialog.close(); }
export function bindDialog(dialog) {
  $$('[data-close]',dialog).forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
  dialog.addEventListener('click',event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  });
  dialog.addEventListener('close',() => {
    if (!$('dialog[open]')) document.body.classList.remove('dialog-open');
    const source = returnFocus.get(dialog);
    if (source?.isConnected && !source.closest('[inert]')) source.focus({preventScroll:true});
  });
}
