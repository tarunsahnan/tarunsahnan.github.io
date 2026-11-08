'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* header border on scroll */
  const bar = $('.bar');
  const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* toast */
  let toastTimer;
  const toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };

  /* copy email */
  const copy = $('#copy');
  if (copy) copy.addEventListener('click', async () => {
    const email = copy.dataset.email;
    try { await navigator.clipboard.writeText(email); toast('Copied. Talk soon.'); }
    catch { toast(email); }
  });

  /* season tabs (progressive enhancement: without JS every season is visible) */
  const tablist = $('.season-tabs');
  if (tablist) {
    const tabs = $$('[role="tab"]', tablist);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tablist.hidden = false;
    select(tabs[0], false);
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n], true); }
      });
    });
  }

  /* active nav link */
  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href')));
  if ('IntersectionObserver' in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => s && navObs.observe(s));
  }

  /* reveal on scroll */
  if (!reduce && 'IntersectionObserver' in window) {
    const items = $$('.ep, .more-card, .original-feature, .original, .credits div, .upnext');
    items.forEach((el) => el.classList.add('reveal'));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => obs.observe(el));
  }

  /* "Up next" countdown: runs once when contact scrolls into view */
  const ring = $('#ring');
  const count = $('#count');
  const upnext = $('.upnext');
  if (ring && count && upnext) {
    const total = 10;
    const C = 176;
    const finish = () => { ring.style.strokeDashoffset = '0'; count.textContent = '▶'; };
    if (reduce || !('IntersectionObserver' in window)) { finish(); }
    else {
      let started = false;
      const io = new IntersectionObserver((entries) => {
        if (started || !entries[0].isIntersecting) return;
        started = true; io.disconnect();
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / (total * 1000), 1);
          ring.style.strokeDashoffset = String(C * (1 - p));
          count.textContent = p < 1 ? String(Math.ceil(total * (1 - p))) : '▶';
          if (p < 1) requestAnimationFrame(tick);
          else toast('Still watching? My inbox is open.');
        };
        requestAnimationFrame(tick);
      }, { threshold: .6 });
      io.observe(upnext);
    }
  }

  /* the remote: keyboard shortcuts */
  const remote = $('#remote');
  const openRemote = () => { if (!remote.open) remote.showModal(); };
  $('#remote-open').addEventListener('click', openRemote);
  $('.remote-close', remote).addEventListener('click', () => remote.close());
  remote.addEventListener('click', (e) => { if (e.target === remote) remote.close(); });

  const order = ['top', 'episodes', 'more', 'seasons', 'originals', 'credits', 'contact'].map((id) => document.getElementById(id));
  const go = (el) => el && el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  const currentIndex = () => {
    const y = window.scrollY + 90;
    let idx = 0;
    order.forEach((el, i) => { if (el.offsetTop <= y) idx = i; });
    return idx;
  };

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (remote.open && e.key !== '?') return;
    switch (e.key) {
      case '?': e.preventDefault(); remote.open ? remote.close() : openRemote(); break;
      case 'j': go(order[Math.min(currentIndex() + 1, order.length - 1)]); break;
      case 'k': go(order[Math.max(currentIndex() - 1, 0)]); break;
      case 's': go($('#episodes')); break;
      case '1': case '2': case '3': case '4': go($('#e0' + e.key)); break;
      case 'e': window.location.href = 'mailto:tarunsahnan98@gmail.com'; break;
      default: return;
    }
  });

  /* console hello for the curious */
  console.log('%cTarun Sahnan', 'font: 900 28px sans-serif; color: #f5a524');
  console.log('You opened devtools on a portfolio. We would get along. tarunsahnan98@gmail.com');
})();
