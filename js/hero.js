import { $, loadData, safeURL, tr } from './core.js';

const hero = $('#hero-carousel');
if (hero) init();
async function init() {
  try {
    const { heroSlides } = await loadData('site');
    const slides = (heroSlides || []).filter(s => !s.image || safeURL(s.image));
    if (slides.length < 2) return;
    const controls = $('.hero-controls', hero);
    const toggle = $('.hero-toggle', hero);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobilePhoto = document.createElement('img');
    mobilePhoto.className = 'hero-mobile-photo';
    mobilePhoto.alt = '';
    mobilePhoto.hidden = true;
    $('.hero-visual', hero).append(mobilePhoto);
    let active = 0, paused = reduced.matches, hover = false, focus = false, timer;
    const backgrounds = slides.map(slide => {
      const image = document.createElement('img');
      image.className = 'hero-backdrop';
      image.alt = '';
      if (slide.image) image.src = safeURL(slide.image);
      else image.hidden = true;
      $('.hero-backdrops', hero).append(image);
      return image;
    });
    const dots = slides.map((slide, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', () => show(index));
      $('.hero-pagination', hero).append(button);
      return button;
    });
    function labels() {
      dots.forEach((dot, index) => dot.setAttribute('aria-label', tr(`${index + 1}번 슬라이드 보기`, `Show slide ${index + 1}`)));
      toggle.textContent = paused ? tr('재생', 'Play') : tr('일시정지', 'Pause');
      toggle.setAttribute('aria-pressed', String(paused));
    }
    function schedule() {
      clearInterval(timer);
      if (!paused && !hover && !focus && !document.hidden && !document.body.classList.contains('dialog-open')) {
        timer = setInterval(() => {
          if (!document.body.classList.contains('dialog-open')) show((active + 1) % slides.length);
        }, 6000);
      }
    }
    function show(index) {
      active = (index + slides.length) % slides.length;
      hero.classList.toggle('hero-photo-mode', Boolean(slides[active].image));
      mobilePhoto.hidden = !slides[active].image;
      if (slides[active].image) mobilePhoto.src = safeURL(slides[active].mobileImage) || safeURL(slides[active].image);
      else mobilePhoto.removeAttribute('src');
      backgrounds.forEach((image, i) => image.classList.toggle('is-active', i === active));
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === active)));
      $('.hero-example', hero).hidden = !slides[active].sample;
      $('.hero-count', hero).textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      schedule();
    }
    $('.hero-previous', hero).addEventListener('click', () => show(active - 1));
    $('.hero-next', hero).addEventListener('click', () => show(active + 1));
    toggle.addEventListener('click', () => { paused = !paused; labels(); schedule(); });
    hero.addEventListener('mouseenter', () => { hover = true; schedule(); });
    hero.addEventListener('mouseleave', () => { hover = false; schedule(); });
    hero.addEventListener('focusin', () => { focus = true; schedule(); });
    hero.addEventListener('focusout', event => { focus = hero.contains(event.relatedTarget); schedule(); });
    hero.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); show(active + (event.key === 'ArrowRight' ? 1 : -1));
    });
    reduced.addEventListener('change', () => { if (reduced.matches) paused = true; labels(); schedule(); });
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('languagechange', labels);
    document.addEventListener('close', schedule, true);
    controls.hidden = false;
    labels(); show(0);
  } catch { /* The original hero remains available if its configuration cannot load. */ }
}
