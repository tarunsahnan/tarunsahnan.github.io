'use strict';
/*
  "ask tarun": a scripted agent over Tarun Sahnan's real work.
  - No LLM, no network calls, no tracking. Every answer is hand-written below.
  - The classic page in index.html is the source of truth and the no-JS site.
    Diagrams, timeline and project cards shown by the agent are cloned from it.
*/
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const STATE = params.get('state'); // debug freeze points: typing | tools | stream | done
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wideMQ = window.matchMedia('(min-width: 1200px)');
  const EMAIL = 'tarunsahnan98@gmail.com';
  if (STATE) root.setAttribute('data-state', STATE);

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const textOf = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); };

  /* ================= shared ================= */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  let toastTimer;
  const toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  };
  const copyText = async (text, ok) => {
    try { await navigator.clipboard.writeText(text); toast(ok); } catch (e) { toast(text); }
  };
  const copyEmail = () => copyText(EMAIL, 'Email copied');

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    store.set('theme', t);
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'dark' ? '#0c0c0d' : '#fafaf9'));
  };
  const toggleTheme = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');

  /* ================= classic view ================= */
  const classic = $('#classic');
  const topBar = $('.top');
  let stick = true;
  const onScroll = () => {
    if (topBar) topBar.classList.toggle('scrolled', window.scrollY > 4);
    stick = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 140;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  if ('IntersectionObserver' in window) {
    const links = $$('.top nav a');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + en.target.id)));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
    if (!reduce) {
      const rise = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); rise.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px' });
      $$('#classic .case, #classic .feature, #classic .projects li, #classic .timeline li').forEach((n) => { n.classList.add('rise'); rise.observe(n); });
    }
  }

  /* ================= mount the agent ================= */
  const tpl = $('#agent-tpl');
  document.body.insertBefore(tpl.content.cloneNode(true), $('#toast'));
  const app = $('#app');
  const thread = $('#thread');
  const skipBtn = $('#skip-run');
  const skipLink = $('.skip');
  const panelTabs = $('#panel-tabs');
  const panelBody = $('#panel-body');
  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');
  document.body.append(live);

  /* ================= views (one <main> at a time) ================= */
  const scrollPos = { agent: null, classic: null };
  let started = false;
  const applyView = (v) => {
    root.setAttribute('data-view', v);
    app.hidden = v !== 'agent';
    classic.hidden = v !== 'classic';
    skipLink.setAttribute('href', v === 'agent' ? '#thread' : '#main');
  };
  const setView = (v, opts = {}) => {
    const cur = root.getAttribute('data-view');
    if (cur === v && !opts.scrollTo) return;
    scrollPos[cur] = window.scrollY;
    if (v === 'classic') finishNow();
    applyView(v);
    store.set('view', v);
    const target = opts.scrollTo && $(opts.scrollTo);
    if (target) target.scrollIntoView({ block: 'start' });
    else if (scrollPos[v] != null) window.scrollTo(0, scrollPos[v]);
    else window.scrollTo(0, v === 'agent' ? document.documentElement.scrollHeight : 0);
    if (v === 'agent' && !started) startAgent();
  };

  /* ================= knowledge (hand-written from his résumé) ================= */
  const ICON = {
    diagram: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="3" y="9" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="15" y="3" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="15" y="15" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 12h3m0 0V6h3m-3 6v6h3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    person: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    fit: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 3h7l5 5v13H7z M14 3v5h5 M10 14l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>'
  };
  const LEVEL = 'Full-stack engineer · ~3.5 yrs · backend + AI in production · remote from Noida';
  const TAGLINE = 'Backend systems and AI agents, and the web and TV apps that sit on top of them.';

  const A = {
    agent: { id: 'agent', title: 'One User, One Agent', kind: 'Diagram', icon: 'diagram', from: '#c-agent .diagram', link: '#c-agent' },
    promo: { id: 'promo', title: 'Promo-to-ad pipeline', kind: 'Diagram', icon: 'diagram', from: '#c-promo .diagram', link: '#c-promo' },
    login: { id: 'login', title: 'Auto-login flow', kind: 'Diagram', icon: 'diagram', from: '#c-login .diagram', link: '#c-login' },
    web: { id: 'web', title: 'Website & TV apps', kind: 'Metrics', icon: 'chart', from: '#c-web .delta-groups', link: '#c-web' },
    inspex: { id: 'inspex', title: 'inspex.in', kind: 'Project', icon: 'link', from: '#projects .feature', link: '#projects' },
    timeline: { id: 'timeline', title: 'Experience', kind: 'Timeline', icon: 'list', from: '#experience .timeline', link: '#experience' },
    skills: { id: 'skills', title: 'Tools he uses', kind: 'List', icon: 'list', from: '#skills .skills', link: '#skills' }
  };

  const T = {
    who: {
      q: 'Who is Tarun Sahnan?', side: 'Who is Tarun?', chip: 'Who is Tarun?',
      tools: [['read_resume()', '3 roles · 1 degree · 2022 – now'], ['query_projects({ sort: "impact" })', 'ranked by measured results'], ['open_case_study("1U1A")', 'diagram attached']],
      blocks: [
        { p: '<b>Tarun Sahnan</b> is a full-stack engineer (~3.5 years) whose strongest work is backend and AI systems. Since July 2024 he has been at <b>STAGE</b>, an OTT platform for Haryanvi, Rajasthani and Bhojpuri shows. He works remote from Noida.' },
        { metrics: [['~100K/day', 'AI agent generations (~1 lakh)'], ['7% → 13%', 'subscription conversion'], ['₹4L/mo', 'tooling saved (~US$4.7K)'], ['~70%', 'lower infra cost']] },
        { p: 'Highlights:' },
        { ul: [
          'Sole developer of <b>One User, One Agent</b>, a per-user AI agent for recommendations, WhatsApp and voice conversations, and proactive outreach.',
          'Built an in-house <b>campaign platform</b> on NestJS, PostgreSQL, Kafka, ClickHouse and Temporal.',
          'Built the <b>STAGE website</b> from scratch (~300K organic search clicks) and rewrote the <b>TV app</b> in React.',
          'On his own, he runs <b>Inspex</b>, a live company-intelligence product with payments.'
        ] },
        { artifact: 'agent' }
      ],
      follow: ['ai', 'backend', 'inspex', 'contact']
    },
    ai: {
      q: 'What has he built with AI?', side: 'AI work', chip: 'What has he built with AI?',
      tools: [['search_work({ tag: "ai" })', '6 matches'], ['open_case_study("1U1A")', 'diagram attached']],
      blocks: [
        { p: 'Mostly at STAGE, where the AI work runs in production:' },
        { ul: [
          '<b>One User, One Agent (1U1A).</b> He is the only developer on it. Every user gets their own agent for recommendations, WhatsApp and voice conversations, and proactive outreach.',
          '<b>Agentic paywall.</b> It runs continuous experiments; subscription conversion went from 7% to 13%.',
          '<b>AI-written ad copy</b> inside the promo-to-ad pipeline.'
        ] },
        { metrics: [['~100K/day', 'generations (~1 lakh)'], ['~5s', 'personalised home page at that scale'], ['7% → 13%', 'paywall conversion'], ['1', 'developer on 1U1A: him']] },
        { artifact: 'agent' },
        { p: 'On his own: <b>Exam Sankalp</b> generates practice questions with AI, and <b>Citovo</b> (in progress) writes blogs and agent-ready fix prompts. During his internship at Krishify he built the complete React frontend for <b>Bhumi</b>, an agricultural AI chatbot, in a 48-hour hackathon. It shipped to production.' }
      ],
      follow: ['backend', 'inspex', 'contact']
    },
    backend: {
      q: 'Show me backend work', side: 'Backend & systems', chip: 'Show me backend work',
      tools: [['query_projects({ stack: "backend" })', '6 results'], ['open_case_study("promo-to-ad")', 'diagram attached'], ['open_case_study("auto-login")', 'diagram attached']],
      blocks: [
        { p: 'Most of his recent work is backend. The two biggest:' },
        { ul: [
          '<b>Campaign platform</b> on NestJS, PostgreSQL, Kafka, ClickHouse and Temporal, with idempotent requests, per-recipient tracking and retry workflows. It saves about ₹4 lakh a month (~US$4.7K) in tooling.',
          '<b>Promo-to-ad pipeline.</b> Uploads used to go server → S3 → Meta one at a time, about 2 minutes each, so at ~200 promos a day the average wait was ~20 minutes. He moved uploads straight from the browser to S3 with presigned URLs, gave Meta a 10-minute presigned link instead of the file, and processed promos in parallel. It now handles ~250 a day, creating draft ads on Meta, Google and Snapchat.'
        ] },
        { artifact: 'promo' },
        { p: 'Also:' },
        { ul: [
          '<b>Auto-login</b> for users from Meta, Google and Snapchat ads. He found the 19% login drop-off himself in the Meta-ads funnel. The deeplink carries a random, opaque hash instead of a user ID or phone number, and the entry is deleted after login. Login conversion went from 81% to 87%.',
          '<b>Schema re-architecture.</b> A title in 10 dialects × 2 languages was 20 documents; now it is 1, backward compatible.',
          '<b>Signed URLs and cookies</b> for time-limited content access, and Next.js hosting moved off AWS Amplify for ~70% lower infra cost.'
        ] },
        { artifact: 'login' }
      ],
      follow: ['ai', 'frontend', 'contact']
    },
    frontend: {
      q: 'What about frontend and TV?', side: 'Web & TV apps', chip: 'Frontend and TV?',
      tools: [['open_case_study("stage-web")', 'metrics loaded'], ['open_case_study("tv-apps")', 'metrics loaded']],
      blocks: [
        { p: 'He built the STAGE website from scratch in Next.js (App Router) and shipped the Samsung (Tizen) and LG (webOS) TV apps.' },
        { artifact: 'web' },
        { p: 'The TV app first shipped as the website. He rewrote it for TV in React on his own initiative; the rewrite loaded ~4s faster and responded to clicks ~60% faster. OTA delivery of web bundles cut releases without native changes from ~2 months to ~2 minutes.' }
      ],
      follow: ['backend', 'ai', 'experience', 'contact']
    },
    inspex: {
      q: 'Tell me about Inspex', side: 'Inspex & side projects', chip: 'Tell me about Inspex',
      tools: [['open_project("inspex")', 'live · built solo']],
      blocks: [
        { p: 'Inspex is his own product, built and run solo: search 3.8M+ (38 lakh+) registered Indian companies, pay ₹299 (~US$3.5), and get official MCA documents by email.' },
        { artifact: 'inspex' },
        { p: 'He also runs <b>Exam Sankalp</b> (live), a practice platform for Indian government exams with AI-generated questions, and is building <b>Citovo</b>, an automated SEO and GEO platform.' }
      ],
      follow: ['ai', 'why', 'contact']
    },
    experience: {
      q: 'Walk me through his experience', side: 'Experience', chip: 'Experience',
      tools: [['read_resume({ section: "experience" })', '3 roles · 1 degree']],
      blocks: [
        { p: 'Full-time since June 2023, after an internship at Krishify:' },
        { artifact: 'timeline' }
      ],
      follow: ['backend', 'skills', 'why', 'contact']
    },
    skills: {
      q: "What's his stack?", side: 'Stack', chip: "What's his stack?",
      tools: [['read_resume({ section: "skills" })', '10 groups']],
      blocks: [
        { p: 'Grouped by the job each tool does:' },
        { artifact: 'skills' }
      ],
      follow: ['backend', 'contact']
    },
    contact: {
      q: 'How do I contact him?', side: 'Contact', chip: 'How do I contact him?',
      tools: [['get_contact()', 'email · LinkedIn · GitHub']],
      blocks: [
        { p: 'Email is the fastest way. He is open to remote full-stack roles.' },
        { actions: true }
      ],
      follow: ['why', 'experience']
    },
    why: {
      q: 'Why hire him?', side: 'Why hire him?', chip: 'Why hire him?',
      tools: [['summarize({ evidence_only: true })', '4 points, each from his work']],
      blocks: [
        { p: "I'll stick to evidence from his work:" },
        { ul: [
          '<b>He owns things end to end.</b> He is the sole developer of 1U1A, and he built the STAGE website and the campaign platform himself.',
          '<b>He reads the data.</b> He spotted the 19% login drop-off in the Meta-ads funnel and designed the fix (81% → 87%).',
          '<b>He measures outcomes.</b> 7% → 13% subscription conversion, ~₹4 lakh (~US$4.7K) a month saved, ~70% lower infra cost, releases in ~2 minutes instead of ~2 months.',
          '<b>He ships products on his own.</b> Inspex is live with payments, automation and funnel tracking, built solo.'
        ] }
      ],
      follow: ['contact', 'backend']
    },
  };
  const DEEP = { who: 'who', ai: 'ai', backend: 'backend', frontend: 'frontend', inspex: 'inspex', experience: 'experience', stack: 'skills', skills: 'skills', contact: 'contact', why: 'why' };
  const DEEP_NAME = { skills: 'stack' };

  /* ================= run engine: one run at a time, cancellable ================= */
  let runId = 0;
  let busy = false;
  let instant = reduce;
  let introActive = false;
  let currentRun = Promise.resolve();
  let skipNow = () => {};
  let skipP = Promise.resolve();
  // the first-visit intro plays at a calmer pace than answers to clicks
  const INTRO_PACE = 2.6;
  const wait = (ms) => (instant ? Promise.resolve() : Promise.race([new Promise((r) => setTimeout(r, introActive ? ms * INTRO_PACE : ms)), skipP]));
  const gate = (name) => (introActive && STATE === name ? new Promise(() => {}) : Promise.resolve());
  function finishNow() { if (!busy) return; instant = true; skipNow(); }
  const startRun = () => {
    busy = true;
    root.classList.add('busy');
    thread.setAttribute('aria-busy', 'true');
    skipBtn.hidden = false;
    skipP = new Promise((r) => { skipNow = r; });
    instant = reduce;
  };
  const stopRun = () => {
    busy = false;
    root.classList.remove('busy');
    thread.setAttribute('aria-busy', 'false');
    skipBtn.hidden = true;
    instant = reduce;
  };
  const follow = () => { if (stick) window.scrollTo(0, document.documentElement.scrollHeight); };

  /* ---------- workspace panel (wide screens) ---------- */
  const panelItems = new Map();
  const cleanClone = (sel) => {
    const src = $(sel);
    if (!src) return el('div');
    const c = src.cloneNode(true);
    c.querySelectorAll('svg[aria-labelledby]').forEach((svg) => {
      const t = svg.querySelector('title');
      if (t) svg.setAttribute('aria-label', t.textContent);
      svg.removeAttribute('aria-labelledby');
    });
    [c, ...c.querySelectorAll('[id]')].forEach((n) => n.removeAttribute('id'));
    [c, ...c.querySelectorAll('[aria-labelledby]')].forEach((n) => n.removeAttribute('aria-labelledby'));
    [c, ...c.querySelectorAll('.rise')].forEach((n) => n.classList.remove('rise', 'in'));
    return c;
  };
  const buildArtifactBody = (a) => (a.build ? a.build() : cleanClone(a.from));

  const profileNode = () => {
    const d = el('div', 'profile');
    d.innerHTML = `
      <div class="profile-head"><span class="mark mark-lg" aria-hidden="true">ts<i></i></span>
        <div><p class="profile-name">Tarun Sahnan</p><p class="profile-level">${LEVEL}</p></div></div>
      <p class="profile-tag">${TAGLINE}</p>
      <dl class="profile-facts">
        <div><dt>Now</dt><dd>Software Engineer, STAGE · since Jul 2024</dd></div>
        <div><dt>Before</dt><dd>Liberin Technologies (2023–24) · Krishify, intern (2022–23)</dd></div>
        <div><dt>Education</dt><dd>B.Tech CSE, Lovely Professional University · 8.54/10</dd></div>
        <div><dt>Side projects</dt><dd>Inspex (live) · Exam Sankalp (live) · Citovo</dd></div>
        <div><dt>Open to</dt><dd>Remote full-stack roles</dd></div>
      </dl>
      <div class="profile-links">
        <a class="act act-primary" href="mailto:${EMAIL}"><span>Email</span><small>${EMAIL}</small></a>
        <a class="act" href="https://www.linkedin.com/in/tarun-sahnan" target="_blank" rel="noopener">LinkedIn ↗</a>
        <a class="act" href="https://github.com/tarunsahnan" target="_blank" rel="noopener">GitHub ↗</a>
      </div>
      <p class="profile-note">Every answer on the left is hand-written from his résumé. Use “view source” under an answer to see the data behind it.</p>`;
    return d;
  };
  const showInPanel = (id) => {
    const item = panelItems.get(id);
    if (!item) return;
    $$('button', panelTabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.id === id)));
    panelBody.replaceChildren(item.render());
    panelBody.scrollTop = 0;
    $$('.artifact', thread).forEach((c) => c.classList.toggle('in-panel', c.dataset.id === id));
  };
  const addPanelItem = (id, label, icon, render) => {
    if (!panelItems.has(id)) {
      const b = el('button', 'ptab', `<span class="ptab-ico">${ICON[icon] || ''}</span>`);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.dataset.id = id;
      b.append(label);
      b.addEventListener('click', () => showInPanel(id));
      panelTabs.append(b);
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    panelItems.set(id, { render });
  };
  addPanelItem('profile', 'Profile', 'person', profileNode);
  showInPanel('profile');

  /* ---------- rendering ---------- */
  const wordsify = (node) => {
    const units = [];
    const walk = (n) => {
      [...n.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = el('span', 'w');
            s.textContent = part;
            frag.append(s);
            units.push(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(node);
    return units;
  };
  const stream = async (container, html, gateName) => {
    container.innerHTML = html;
    const units = wordsify(container);
    if (instant) { units.forEach((u) => u.classList.add('on')); return; }
    const caret = el('span', 'caret');
    caret.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < units.length; i++) {
      units[i].classList.add('on');
      units[i].after(caret);
      if (gateName && i === Math.floor(units.length * 0.55)) await gate(gateName);
      if (instant) { units.forEach((u) => u.classList.add('on')); break; }
      await wait(22);
      if (i % 2 === 1) follow();
    }
    caret.remove();
  };

  const artifactCard = (a) => {
    const card = el('div', 'artifact pop');
    card.dataset.id = a.id;
    const head = el('div', 'art-head');
    head.innerHTML = `<span class="art-ico">${ICON[a.icon] || ''}</span><span class="art-title"></span><span class="art-kind"></span>`;
    head.querySelector('.art-title').textContent = a.title;
    head.querySelector('.art-kind').textContent = a.kind;
    const show = el('button', 'art-show', 'Show in workspace');
    show.type = 'button';
    show.addEventListener('click', () => showInPanel(a.id));
    head.append(show);
    if (a.link) {
      const open = el('button', 'art-open', 'Open section <span aria-hidden="true">↓</span>');
      open.type = 'button';
      open.addEventListener('click', () => setView('classic', { scrollTo: a.link }));
      head.append(open);
    }
    const body = el('div', 'art-body');
    body.append(buildArtifactBody(a));
    card.append(head, body);
    addPanelItem(a.id, a.title, a.icon, () => {
      const w = el('div', 'panel-art');
      const h = el('div', 'panel-art-head', `<span class="art-kind"></span><h2></h2>`);
      h.querySelector('.art-kind').textContent = a.kind;
      h.querySelector('h2').textContent = a.title;
      w.append(h, buildArtifactBody(a));
      if (a.link) {
        const open = el('button', 'linkish panel-open', 'Open this section in the classic view ↓');
        open.type = 'button';
        open.addEventListener('click', () => setView('classic', { scrollTo: a.link }));
        w.append(open);
      }
      return w;
    });
    return card;
  };

  const actionsCard = () => {
    const d = el('div', 'actions-card pop');
    d.innerHTML = `<a class="act act-primary" href="mailto:${EMAIL}"><span>Email Tarun</span><small>${EMAIL}</small></a>
      <button class="act" type="button" data-copy-email>Copy email</button>
      <a class="act" href="https://www.linkedin.com/in/tarun-sahnan" target="_blank" rel="noopener">LinkedIn <span aria-hidden="true">↗</span></a>
      <a class="act" href="https://github.com/tarunsahnan" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>`;
    return d;
  };

  const runTools = async (body, tools) => {
    const det = el('details', 'tools');
    det.open = true;
    det.innerHTML = '<summary><span class="tools-ico" aria-hidden="true"></span><span class="tools-label">Working</span><span class="chev" aria-hidden="true"></span></summary><ol></ol>';
    const ol = $('ol', det);
    body.append(det);
    follow();
    for (let i = 0; i < tools.length; i++) {
      const [call, res] = tools[i];
      const li = el('li', 'tool run', '<span class="st" aria-hidden="true"></span><code></code>');
      li.querySelector('code').textContent = call;
      ol.append(li);
      follow();
      if (i === 1) await gate('tools');
      await wait(260);
      li.classList.replace('run', 'ok');
      const r = el('p', 'res');
      r.textContent = '→ ' + res;
      li.append(r);
    }
    $('.tools-label', det).textContent = `Used ${tools.length} tool${tools.length > 1 ? 's' : ''}`;
    det.classList.add('done');
    return det;
  };

  const renderBlocks = async (body, blocks) => {
    const ans = el('div', 'answer');
    body.append(ans);
    let gated = false;
    for (const b of blocks) {
      if (b.p) {
        const p = el('p');
        ans.append(p);
        await stream(p, b.p, !gated && introActive ? 'stream' : null);
        gated = true;
      } else if (b.ul) {
        const ul = el('ul');
        ans.append(ul);
        for (const h of b.ul) { const li = el('li'); ul.append(li); await stream(li, h); }
      } else if (b.metrics) {
        const d = el('div', 'metrics');
        b.metrics.forEach(([v, l]) => {
          const m = el('div', 'metric pop', '<span class="mv"></span><span class="ml"></span>');
          m.querySelector('.mv').textContent = v;
          m.querySelector('.ml').textContent = l;
          d.append(m);
        });
        ans.append(d);
        for (const n of d.children) { n.classList.add('on'); await wait(70); }
      } else if (b.artifact) {
        const a = typeof b.artifact === 'string' ? A[b.artifact] : b.artifact;
        const card = artifactCard(a);
        ans.append(card);
        if (wideMQ.matches) showInPanel(a.id);
        await wait(30);
        card.classList.add('on');
        await wait(240);
      } else if (b.actions) {
        const a = actionsCard();
        ans.append(a);
        await wait(30);
        a.classList.add('on');
      }
      follow();
    }
    return ans;
  };

  const sourceOf = (key, t) => {
    const blocks = t.blocks.map((b) => {
      if (b.p) return { p: textOf(b.p) };
      if (b.ul) return { ul: b.ul.map(textOf) };
      if (b.metrics) return { metrics: b.metrics };
      if (b.artifact) return { artifact: typeof b.artifact === 'string' ? b.artifact : b.artifact.title };
      if (b.actions) return { actions: ['email', 'copy', 'linkedin', 'github'] };
      return b;
    });
    const o = { topic: key, question: t.q || undefined, tools: t.tools.map(([call, result]) => ({ call, result })), blocks, follow: t.follow || [] };
    if (t.source) o.source = t.source;
    return JSON.stringify(o, null, 2);
  };

  const answerFooter = (body, key, t) => {
    const f = el('div', 'ans-foot');
    if (DEEP[key] || DEEP_NAME[key]) {
      const share = el('button', 'foot-btn', 'Copy link');
      share.type = 'button';
      share.addEventListener('click', () => copyText(location.href.split(/[?#]/)[0] + '?q=' + (DEEP_NAME[key] || key), 'Link to this answer copied'));
      f.append(share);
    }
    const src = el('button', 'foot-btn', 'View source');
    src.type = 'button';
    src.setAttribute('aria-expanded', 'false');
    const pre = el('pre', 'src');
    pre.hidden = true;
    const code = el('code');
    code.textContent = sourceOf(key, t);
    pre.append(code);
    src.addEventListener('click', () => {
      pre.hidden = !pre.hidden;
      src.setAttribute('aria-expanded', String(!pre.hidden));
      src.textContent = pre.hidden ? 'View source' : 'Hide source';
    });
    f.append(src);
    body.append(f, pre);
  };

  // one-line hint under each suggested question in the picker
  const DESC = {
    who: 'The short version, with numbers',
    ai: '1U1A, agentic paywall, AI ad copy',
    backend: 'Campaign platform, promo pipeline, auto-login',
    frontend: 'STAGE website and the TV app rewrite',
    inspex: 'His own live product, built solo',
    experience: 'Roles and dates, 2022 to now',
    skills: 'Grouped by what each tool is for',
    contact: 'Email, LinkedIn, GitHub',
    why: 'Four points, each backed by his work'
  };

  // Claude-style "pick one" card: numbered options, keys 1–N select
  const followUps = (body, keys) => {
    const d = el('div', 'qcard pop');
    d.setAttribute('role', 'group');
    d.setAttribute('aria-labelledby', 'qh' + runId);
    const h = el('p', 'qcard-h', 'What would you like to know next?');
    h.id = 'qh' + runId;
    const list = el('div', 'qcard-list');
    keys.forEach((k, i) => {
      const b = el('button', 'qopt');
      b.type = 'button';
      b.dataset.topic = k;
      b.innerHTML = `<kbd aria-hidden="true">${i + 1}</kbd><span class="qopt-t"></span><span class="qopt-d"></span><span class="qopt-go" aria-hidden="true">→</span>`;
      b.querySelector('.qopt-t').textContent = T[k].chip;
      b.querySelector('.qopt-d').textContent = DESC[k] || '';
      list.append(b);
    });
    d.append(h, list);
    body.append(d);
    requestAnimationFrame(() => d.classList.add('on'));
  };

  // after a pick, the card collapses to the chosen option, like an answered question
  const settleCard = (btn) => {
    const card = btn && btn.closest('.qcard');
    if (!card || card.classList.contains('answered')) return;
    card.classList.add('answered');
    $$('.qopt', card).forEach((o) => { o.disabled = true; o.classList.toggle('picked', o === btn); });
  };
  const settleOpenCards = () => $$('.qcard:not(.answered)', thread).forEach((c) => {
    c.classList.add('answered', 'skipped');
    $$('.qopt', c).forEach((o) => { o.disabled = true; });
  });

  const announce = (t) => {
    const parts = [];
    for (const b of t.blocks) {
      if (b.p) parts.push(textOf(b.p));
      else if (b.ul) parts.push(b.ul.length + ' points');
      else if (b.metrics) parts.push(b.metrics.map(([v, l]) => v + ' ' + l).join('; '));
      else if (b.artifact) parts.push((typeof b.artifact === 'string' ? A[b.artifact].title : b.artifact.title) + ' card');
      if (parts.join(' ').length > 260) break;
    }
    let s = parts.join('. ').replace(/\.\./g, '.');
    if (s.length > 320) { const cut = s.lastIndexOf('. ', 320); s = s.slice(0, cut > 80 ? cut + 1 : 320); }
    live.textContent = '';
    setTimeout(() => { live.textContent = s + ' Answer ready.'; }, 60);
  };

  let lastUser = null;
  const addUser = (text) => {
    const m = el('div', 'msg msg-user');
    lastUser = m;
    const b = el('div', 'bubble');
    b.textContent = text;
    m.append(b);
    thread.append(m);
    follow();
  };
  const addAgent = () => {
    const m = el('div', 'msg msg-agent');
    m.innerHTML = '<span class="mark avatar" aria-hidden="true">ts<i></i></span>';
    const body = el('div', 'msg-body');
    m.append(body);
    thread.append(m);
    return body;
  };
  const setActive = (key) => $$('.rail-topics button').forEach((b) => b.classList.toggle('active', b.dataset.topic === key));

  async function answer(key, t, opts) {
    if (opts.instant) instant = true;
    setActive(key);
    addUser(opts.text || t.q);
    await wait(160);
    const body = addAgent();
    const th = el('p', 'thinking', 'Thinking');
    body.append(th);
    follow();
    await wait(360);
    th.remove();
    let det = null;
    if (t.tools.length) det = await runTools(body, t.tools);
    await wait(100);
    const ans = await renderBlocks(body, t.blocks);
    if (det) det.open = false;
    answerFooter(body, key, t);
    if (t.follow) followUps(body, t.follow);
    announce(t);
    if (params.get('scroll') === 'end') window.scrollTo(0, document.documentElement.scrollHeight);
    else if (instant && !opts.user && lastUser) lastUser.scrollIntoView({ block: 'start' });
    else follow();
    if (opts.user) { ans.setAttribute('tabindex', '-1'); ans.focus({ preventScroll: true }); }
  }

  /* Public entry: cancels whatever is running (including the intro), then answers. */
  async function ask(key, opts = {}) {
    const id = ++runId;
    if (busy) { instant = true; skipNow(); await currentRun; }
    if (id !== runId) return;
    const t = opts.topic || T[key];
    startRun();
    currentRun = answer(key, t, opts);
    await currentRun;
    if (id === runId) stopRun();
  }

  async function intro() {
    const id = ++runId;
    if (busy) { instant = true; skipNow(); await currentRun; }
    if (id !== runId) return;
    startRun();
    introActive = true;
    if (STATE === 'done') instant = true;
    currentRun = (async () => {
      if (!instant) {
        await wait(650);
        if (id !== runId) return;
      }
      await answer('who', T.who, {});
      store.set('introSeen', '1');
    })();
    await currentRun;
    introActive = false;
    if (id === runId) stopRun();
  }

  const welcome = () => {
    const w = el('section', 'welcome');
    w.setAttribute('aria-labelledby', 'welcome-t');
    w.innerHTML = `<span class="mark mark-xl" aria-hidden="true">ts<i></i></span>
      <h1 id="welcome-t">Tarun Sahnan</h1>
      <p class="welcome-tag">${TAGLINE}</p>
      <p class="welcome-level">${LEVEL}</p>`;
    return w;
  };

  // first-visit splash: says what this page is before the intro starts
  const splash = () => new Promise((resolve) => {
    const s = el('div', 'splash');
    s.setAttribute('role', 'dialog');
    s.setAttribute('aria-modal', 'true');
    s.setAttribute('aria-labelledby', 'splash-t');
    s.innerHTML = `<div class="splash-card">
        <span class="mark mark-xl" aria-hidden="true">ts<i></i></span>
        <p class="splash-kicker">ask tarun</p>
        <h1 id="splash-t">Tarun Sahnan</h1>
        <p class="splash-lede">Full-stack engineer, ~3.5 years. Backend systems and AI agents in production at STAGE, plus the web and TV apps on top of them.</p>
        <p class="splash-h">What to expect</p>
        <ol class="splash-list">
          <li><b>A chat-style tour of his real work.</b> Every answer is hand-written from his résumé. No AI model, no tracking.</li>
          <li><b>You steer it.</b> Pick a topic, or a card after each answer.</li>
          <li><b>Proof, not claims.</b> Diagrams and numbers for each project open alongside.</li>
          <li><b>Prefer one page?</b> The classic view has everything, any time.</li>
        </ol>
        <div class="splash-actions">
          <button type="button" class="splash-go">Start the tour <span aria-hidden="true">→</span></button>
          <button type="button" class="splash-classic">Classic view</button>
        </div>
        <p class="splash-hint">Press <kbd>Enter</kbd> to start</p>
      </div>`;
    document.body.append(s);
    requestAnimationFrame(() => s.classList.add('on'));
    const done = (view) => {
      document.removeEventListener('keydown', onKey, true);
      s.classList.remove('on');
      setTimeout(() => s.remove(), reduce ? 0 : 320);
      resolve(view);
    };
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done('agent'); }
    };
    document.addEventListener('keydown', onKey, true);
    $('.splash-go', s).addEventListener('click', () => done('agent'));
    $('.splash-classic', s).addEventListener('click', () => done('classic'));
    $('.splash-go', s).focus({ preventScroll: true });
  });

  function startAgent() {
    started = true;
    thread.replaceChildren(welcome());
    const deep = DEEP[(params.get('q') || '').toLowerCase()];
    const forceSplash = params.get('splash') === '1';
    if (deep) { store.set('introSeen', '1'); ask(deep, { instant: true }); }
    else if (store.get('introSeen') && !STATE && !forceSplash) ask('who', { instant: true });
    else {
      if (!STATE) store.set('introSeen', '1');
      if (STATE) { intro(); return; }
      splash().then((v) => {
        if (v === 'classic') { setView('classic'); ask('who', { instant: true }); } else intro();
      });
    }
  }

  /* ---------- wiring ---------- */
  const rail = $('#rail-topics');
  ['who', 'ai', 'backend', 'frontend', 'inspex', 'experience', 'skills', 'contact', 'why'].forEach((k) => {
    const li = el('li');
    const b = el('button');
    b.type = 'button';
    b.dataset.topic = k;
    b.textContent = T[k].side;
    li.append(b);
    rail.append(li);
  });

  // one delegated click handler: topics, chips, proof links, view toggles, theme, copy
  document.addEventListener('click', (e) => {
    const topic = e.target.closest('[data-topic]');
    if (topic && app.contains(topic)) {
      if (topic.disabled) return;
      if (topic.closest('.qcard')) settleCard(topic); else settleOpenCards();
      ask(topic.dataset.topic, { user: true });
      return;
    }
    const vt = e.target.closest('[data-view-to]');
    if (vt) { setView(vt.dataset.viewTo); return; }
    if (e.target.closest('.theme-btn')) { toggleTheme(); return; }
    if (e.target.closest('[data-copy-email], #copy')) { copyEmail(); }
  });

  $('#replay').addEventListener('click', () => { thread.replaceChildren(welcome()); window.scrollTo(0, 0); intro(); });
  skipBtn.addEventListener('click', finishNow);

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || $('.splash')) return;
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (e.key === 'Escape') { if (busy) finishNow(); else if (typing) e.target.blur(); return; }
    if (typing) return;
    const agent = root.getAttribute('data-view') === 'agent';
    if (e.key === 't' || e.key === 'T') toggleTheme();
    else if (e.key === 'v' || e.key === 'V') setView(agent ? 'classic' : 'agent');
    else if (agent && !busy && /^[1-9]$/.test(e.key)) {
      const cards = $$('.qcard:not(.answered)', thread);
      const opt = cards.length && $$('.qopt', cards[cards.length - 1])[+e.key - 1];
      if (opt) opt.click();
    }
  });

  wideMQ.addEventListener('change', () => { /* panel visibility is CSS-driven; nothing to rebuild */ });

  onScroll();
  applyView(root.getAttribute('data-view') === 'classic' ? 'classic' : 'agent');
  if (root.getAttribute('data-view') === 'agent') startAgent();

  console.log('ask tarun is a scripted agent: hand-written answers, no LLM, no network calls. Say hi: ' + EMAIL);
})();
