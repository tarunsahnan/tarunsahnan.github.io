'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* header hairline once the page scrolls */
  const top = $('.top');
  const onScroll = () => top.classList.toggle('scrolled', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* theme: system by default, manual choice remembered */
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const current = () => root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* storage blocked */ }
    const meta = document.querySelectorAll('meta[name="theme-color"]');
    meta.forEach((m) => m.setAttribute('content', t === 'dark' ? '#0c0c0d' : '#fafaf9'));
  };
  const toggle = () => setTheme(current() === 'dark' ? 'light' : 'dark');
  $('#theme').addEventListener('click', toggle);

  /* toast + copy email */
  let timer;
  const toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => t.classList.remove('show'), 1800);
  };
  const copy = $('#copy');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copy.dataset.email); toast('Email copied'); }
    catch (e) { toast(copy.dataset.email); }
  });

  /* nav: mark the section in view */
  const links = [...document.querySelectorAll('.top nav a')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + en.target.id)));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });

    /* gentle entrance for case studies and cards */
    if (!reduce) {
      const items = document.querySelectorAll('.case, .feature, .projects li, .timeline li');
      const rise = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); rise.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px' });
      items.forEach((el) => { el.classList.add('rise'); rise.observe(el); });
    }
  }

  /* keyboard: T switches theme */
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.key === 't' || e.key === 'T') toggle();
  });

  console.log('Hi. If you are reading the source, we would probably get along: tarunsahnan98@gmail.com');
})();
