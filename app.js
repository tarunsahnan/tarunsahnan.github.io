'use strict';
/*
  tarun.sh: a scripted "agent" over Tarun's real work.
  No LLM, no network calls, no tracking. Every answer below is hand-written
  from his résumé; diagrams, timeline and project cards are cloned from the
  classic view that is also in the HTML (and shown when JS is off).
*/
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const STATE = params.get('state'); // debug freeze points: typing | tools | stream | done
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMAIL = 'tarunsahnan98@gmail.com';
  if (STATE) root.setAttribute('data-state', STATE);

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  /* ---------------- shared: year, toast, theme, copy ---------------- */
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
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(EMAIL); toast('Email copied'); }
    catch (e) { toast(EMAIL); }
  };
  const copyBtn = $('#copy');
  if (copyBtn) copyBtn.addEventListener('click', copyEmail);

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* storage blocked */ }
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'dark' ? '#0c0c0d' : '#fafaf9'));
  };
  const toggleTheme = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  $$('.theme-btn').forEach((b) => b.addEventListener('click', toggleTheme));

  /* ---------------- classic view behaviour (v2) ---------------- */
  const top = $('.top');
  const onScroll = () => {
    if (top) top.classList.toggle('scrolled', window.scrollY > 4);
    stick = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 140;
  };
  let stick = true;
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

  /* ---------------- view switching ---------------- */
  const setView = (v, opts = {}) => {
    if (v === 'classic') finishNow();
    root.setAttribute('data-view', v);
    try { localStorage.setItem('view', v); } catch (e) { /* storage blocked */ }
    if (v === 'classic') {
      const target = opts.scrollTo && $(opts.scrollTo);
      if (target) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, document.documentElement.scrollHeight);
      if (!started) startAgent();
    }
  };
  $$('button[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  /* ======================= the agent ======================= */
  const thread = $('#thread');
  const form = $('#composer');
  const input = $('#ask');
  const skipBtn = $('#skip-run');
  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');
  document.body.append(live);

  const ICON = {
    diagram: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="3" y="9" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="15" y="3" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="15" y="15" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 12h3m0 0V6h3m-3 6v6h3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };

  /* -------- knowledge: hand-written from Tarun's résumé -------- */
  const T = {
    who: {
      q: 'Who is Tarun Sahnan?', side: 'Who is Tarun?',
      tools: [['read_resume()', '3 roles · 1 degree · 2022 – now', 240], ['query_projects({ sort: "impact" })', 'ranked by measured results', 300], ['open_case_study("1U1A")', 'diagram attached', 220]],
      blocks: [
        { p: '<b>Tarun Sahnan</b> is a full-stack engineer in Noida, working remote. His strongest work is backend and AI systems, plus the web and TV apps that sit on top of them. Since July 2024 he has been a Software Engineer at <b>STAGE</b>, an OTT platform for Haryanvi, Rajasthani and Bhojpuri shows.' },
        { metrics: [['~1 lakh', 'AI agent generations a day'], ['7% → 13%', 'subscription conversion'], ['₹4L/mo', 'tooling cost saved'], ['~70%', 'lower infra cost']] },
        { p: 'A few highlights:' },
        { ul: [
          'Sole developer of <b>One User, One Agent</b>, a per-user AI agent for recommendations, WhatsApp and voice conversations, and proactive outreach.',
          'Built an in-house <b>campaign platform</b> on NestJS, PostgreSQL, Kafka, ClickHouse and Temporal.',
          'Built the <b>STAGE website</b> from scratch (~300K organic search clicks) and rewrote the <b>TV app</b> in React.',
          'On his own, he runs <b>Inspex</b>, a live company-intelligence product with payments.'
        ] },
        { artifact: { title: 'One User, One Agent', kind: 'Diagram', icon: 'diagram', from: '#c-agent .diagram', link: '#c-agent' } }
      ],
      follow: ['ai', 'backend', 'inspex', 'experience', 'why', 'contact']
    },

    ai: {
      q: 'What has he built with AI?', side: 'AI work',
      tools: [['search_work({ tag: "ai" })', '6 matches', 260], ['open_case_study("1U1A")', 'diagram attached', 220]],
      blocks: [
        { p: 'Mostly at STAGE, where the AI work runs in production:' },
        { ul: [
          '<b>One User, One Agent (1U1A).</b> He is the only developer on it. Every user gets their own agent for recommendations, WhatsApp and voice conversations, and proactive outreach.',
          '<b>Agentic paywall.</b> It runs continuous experiments; subscription conversion went from 7% to 13%.',
          '<b>AI-written ad copy</b> inside the promo-to-ad pipeline.'
        ] },
        { metrics: [['~1 lakh', 'generations a day'], ['~5s', 'personalised home page at that scale'], ['7% → 13%', 'paywall conversion']] },
        { artifact: { title: 'One User, One Agent', kind: 'Diagram', icon: 'diagram', from: '#c-agent .diagram', link: '#c-agent' } },
        { p: 'On his own: <b>Exam Sankalp</b> generates practice questions with AI, and <b>Citovo</b> (in progress) writes blogs and agent-ready fix prompts. During his internship at Krishify he built the complete React frontend for <b>Bhumi</b>, an agricultural AI chatbot, in a 48-hour hackathon. It shipped to production.' }
      ],
      follow: ['backend', 'why', 'inspex', 'contact']
    },

    backend: {
      q: 'Show me backend work', side: 'Backend & systems',
      tools: [['query_projects({ stack: "backend" })', '6 results', 280], ['open_case_study("promo-to-ad")', 'diagram attached', 220], ['open_case_study("auto-login")', 'diagram attached', 200]],
      blocks: [
        { p: 'Most of his recent work is backend. The two biggest:' },
        { ul: [
          '<b>Campaign platform</b> on NestJS, PostgreSQL, Kafka, ClickHouse and Temporal, with idempotent requests, per-recipient tracking and retry workflows. It saves about ₹4 lakh a month in tooling.',
          '<b>Promo-to-ad pipeline.</b> Uploads used to go server → S3 → Meta one at a time, about 2 minutes each, so at ~200 promos a day the average wait was ~20 minutes. He moved uploads straight from the browser to S3 with presigned URLs, gave Meta a 10-minute presigned link instead of the file, and processed promos in parallel. It now handles ~250 a day, creating draft ads on Meta, Google and Snapchat.'
        ] },
        { artifact: { title: 'Promo-to-ad pipeline: before and after', kind: 'Diagram', icon: 'diagram', from: '#c-promo .diagram', link: '#c-promo' } },
        { p: 'Also:' },
        { ul: [
          '<b>Auto-login</b> for users from Meta, Google and Snapchat ads. He found the 19% login drop-off himself in the Meta-ads funnel. The deeplink carries a random, opaque hash instead of a user ID or phone number, and the entry is deleted after login. Login conversion went from 81% to 87%.',
          '<b>Schema re-architecture.</b> A title in 10 dialects × 2 languages was 20 documents; now it is 1, backward compatible.',
          '<b>Signed URLs and cookies</b> for time-limited content access, and Next.js hosting moved off AWS Amplify for ~70% lower infra cost.'
        ] },
        { artifact: { title: 'Auto-login flow', kind: 'Diagram', icon: 'diagram', from: '#c-login .diagram', link: '#c-login' } }
      ],
      follow: ['ai', 'frontend', 'experience', 'contact']
    },

    frontend: {
      q: 'What about frontend and TV?', side: 'Web & TV apps',
      tools: [['open_case_study("stage-web")', 'metrics loaded', 240], ['open_case_study("tv-apps")', 'metrics loaded', 220]],
      blocks: [
        { p: 'He built the STAGE website from scratch in Next.js (App Router) and shipped the Samsung (Tizen) and LG (webOS) TV apps.' },
        { artifact: { title: 'Website & TV apps, before → after', kind: 'Metrics', icon: 'chart', from: '#c-web .delta-groups', link: '#c-web' } },
        { p: 'The TV app first shipped as the website. Nobody asked him to, but he rewrote it for TV in React, then added OTA delivery so releases without native changes take ~2 minutes instead of ~2 months.' }
      ],
      follow: ['backend', 'ai', 'experience', 'contact']
    },

    inspex: {
      q: 'Tell me about Inspex', side: 'Inspex & side projects',
      tools: [['open_project("inspex")', 'live · built solo', 260]],
      blocks: [
        { p: 'Inspex is his own product, built and run solo.' },
        { artifact: { title: 'inspex.in', kind: 'Link', icon: 'link', from: '#projects .feature', link: '#projects' } },
        { p: 'He also runs <b>Exam Sankalp</b> (live), a practice platform for Indian government exams with AI-generated questions, and is building <b>Citovo</b>, an automated SEO and GEO platform.' }
      ],
      follow: ['ai', 'why', 'contact']
    },

    experience: {
      q: 'Walk me through his experience', side: 'Experience',
      tools: [['read_resume({ section: "experience" })', '3 roles · 1 degree', 260]],
      blocks: [
        { p: 'Full-time since June 2023, after an internship at Krishify:' },
        { artifact: { title: 'Experience', kind: 'Timeline', icon: 'list', from: '#experience .timeline', link: '#experience' } }
      ],
      follow: ['backend', 'skills', 'why', 'contact']
    },

    skills: {
      q: "What's his stack?", side: 'Stack',
      tools: [['read_resume({ section: "skills" })', '10 groups', 220]],
      blocks: [
        { p: 'Grouped by the job each tool does:' },
        { artifact: { title: 'Tools he uses', kind: 'List', icon: 'list', from: '#skills .skills', link: '#skills' } }
      ],
      follow: ['backend', 'ai', 'contact']
    },

    contact: {
      q: 'How do I contact him?', side: 'Contact',
      tools: [['get_contact()', 'email · LinkedIn · GitHub', 200]],
      blocks: [
        { p: 'Email is the fastest way. He is open to remote full-stack roles.' },
        { actions: true }
      ],
      follow: ['why', 'experience']
    },

    why: {
      q: 'Why hire him?', side: 'Why hire him?',
      tools: [['summarize({ evidence_only: true })', '4 points, each from his work', 320]],
      blocks: [
        { p: "I'll stick to evidence from his work:" },
        { ul: [
          '<b>He owns things end to end.</b> He is the sole developer of 1U1A, and he built the STAGE website and the campaign platform himself.',
          '<b>He finds problems, not just tickets.</b> He spotted the 19% login drop-off in the Meta-ads funnel and designed the fix (81% → 87%). He rewrote the TV app without being asked.',
          '<b>He measures outcomes.</b> 7% → 13% subscription conversion, ~₹4 lakh a month saved, ~70% lower infra cost, releases in ~2 minutes instead of ~2 months.',
          '<b>He ships products on his own.</b> Inspex is live with payments, automation and funnel tracking, built solo.'
        ] },
        { p: 'Whether that fits your team is your call.' }
      ],
      follow: ['contact', 'backend', 'ai']
    },

    hello: {
      q: '', side: null,
      tools: [],
      blocks: [{ p: "Hi! I'm a scripted agent that knows Tarun's work. Ask about his AI work, backend systems, projects or experience, or pick one:" }],
      follow: ['who', 'ai', 'backend', 'inspex', 'contact']
    },

    unknown: {
      q: '', side: null,
      tools: [],
      blocks: [{ p: "I only know what's in Tarun's work history and projects, so I can't answer that one. Try one of these:" }],
      follow: ['who', 'ai', 'backend', 'inspex', 'experience', 'contact']
    }
  };
  const CHIP = {
    who: 'Who is Tarun?', ai: 'What has he built with AI?', backend: 'Show me backend work', frontend: 'Frontend and TV?',
    inspex: 'Tell me about Inspex', experience: 'Experience', skills: "What's his stack?", contact: 'How do I contact him?', why: 'Why hire him?'
  };

  /* -------- keyword matching for typed questions -------- */
  const KEYS = {
    ai: ['ai', 'agent', 'agents', 'llm', 'gpt', 'claude', 'ml', 'machine learning', '1u1a', 'recommend', 'whatsapp', 'voice', 'paywall', 'chatbot', 'bhumi', 'genai'],
    backend: ['backend', 'back-end', 'api', 'apis', 'nest', 'nestjs', 'node', 'kafka', 'clickhouse', 'temporal', 'postgres', 'database', 'db', 'schema', 'pipeline', 'campaign', 's3', 'aws', 'infra', 'auth', 'login', 'system', 'systems', 'scale', 'server'],
    frontend: ['frontend', 'front-end', 'react', 'next', 'nextjs', 'website', 'web', 'tv', 'tizen', 'webos', 'samsung', 'lg', 'lighthouse', 'ui', 'performance', 'vue', 'seo'],
    inspex: ['inspex', 'side project', 'side projects', 'projects', 'project', 'product', 'products', 'startup', 'exam', 'sankalp', 'citovo', 'mca', 'company'],
    experience: ['experience', 'work history', 'job', 'jobs', 'career', 'stage', 'liberin', 'krishify', 'education', 'college', 'university', 'degree', 'cgpa', 'years', 'resume', 'cv'],
    skills: ['skill', 'skills', 'stack', 'tech', 'technologies', 'tools', 'languages', 'typescript', 'javascript', 'kotlin'],
    contact: ['contact', 'email', 'mail', 'reach', 'linkedin', 'github', 'call', 'phone', 'talk', 'message'],
    why: ['why', 'hire', 'hiring', 'strength', 'strengths', 'fit', 'should', 'good at', 'best'],
    who: ['who', 'about', 'tarun', 'summary', 'intro', 'introduce', 'yourself', 'overview']
  };
  const GREET = /^(hi|hey|hello|yo|namaste|hola|sup)\b/;
  const match = (text) => {
    const t = ' ' + text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ') + ' ';
    let best = null, score = 0;
    Object.keys(KEYS).forEach((k) => {
      const s = KEYS[k].reduce((n, w) => n + (t.includes(' ' + w + ' ') || (w.length > 4 && t.includes(w)) ? 1 : 0), 0);
      if (s > score) { score = s; best = k; }
    });
    if (best) return best;
    return GREET.test(t.trim()) ? 'hello' : 'unknown';
  };

  /* -------- timing, skipping and debug freeze points -------- */
  let busy = false;
  let instant = reduce;
  let introRun = false;
  let started = false;
  let currentRun = Promise.resolve();
  let runId = 0;
  let skipNow = () => {};
  let skipP = Promise.resolve();
  const newRun = () => { skipP = new Promise((r) => { skipNow = r; }); };
  const wait = (ms) => (instant ? Promise.resolve() : Promise.race([new Promise((r) => setTimeout(r, ms)), skipP]));
  const gate = (name) => (introRun && STATE === name ? new Promise(() => {}) : Promise.resolve());
  function finishNow() { if (!busy) return; instant = true; skipNow(); }

  const follow = () => { if (stick) window.scrollTo(0, document.documentElement.scrollHeight); };

  /* -------- rendering -------- */
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
      if (i % 2 === 1) { await wait(22); follow(); }
    }
    caret.remove();
  };

  const popIn = async (nodes) => {
    for (const n of nodes) { n.classList.add('on'); await wait(70); }
  };

  const artifact = (a) => {
    const card = el('div', 'artifact pop');
    const head = el('div', 'art-head');
    head.innerHTML = `<span class="art-ico">${ICON[a.icon] || ''}</span><span class="art-title"></span><span class="art-kind">${a.kind}</span>`;
    head.querySelector('.art-title').textContent = a.title;
    const open = el('button', 'art-open', 'Full page <span aria-hidden="true">↗</span>');
    open.type = 'button';
    open.addEventListener('click', () => setView('classic', { scrollTo: a.link }));
    head.append(open);
    const body = el('div', 'art-body');
    body.append(cleanClone(a.from));
    card.append(head, body);
    return card;
  };

  const actionsCard = () => {
    const d = el('div', 'actions-card pop');
    d.innerHTML = `<a class="act act-primary" href="mailto:${EMAIL}"><span>Email Tarun</span><small>${EMAIL}</small></a>
      <button class="act" type="button" data-copy>Copy email</button>
      <a class="act" href="https://www.linkedin.com/in/tarun-sahnan" target="_blank" rel="noopener">LinkedIn <span aria-hidden="true">↗</span></a>
      <a class="act" href="https://github.com/tarunsahnan" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>`;
    d.querySelector('[data-copy]').addEventListener('click', copyEmail);
    return d;
  };

  const runTools = async (body, tools) => {
    const det = el('details', 'tools');
    det.open = true;
    const sum = el('summary', null, '<span class="tools-ico" aria-hidden="true"></span><span class="tools-label">Working</span><span class="tools-time"></span><span class="chev" aria-hidden="true"></span>');
    const ol = el('ol');
    det.append(sum, ol);
    body.append(det);
    follow();
    let total = 0;
    for (let i = 0; i < tools.length; i++) {
      const [call, res, ms] = tools[i];
      const li = el('li', 'tool run', '<span class="st" aria-hidden="true"></span><code></code><span class="ms"></span>');
      li.querySelector('code').textContent = call;
      ol.append(li);
      follow();
      if (i === 1) await gate('tools');
      await wait(ms);
      total += ms;
      li.classList.replace('run', 'ok');
      li.querySelector('.ms').textContent = ms + 'ms';
      const r = el('p', 'res');
      r.textContent = '→ ' + res;
      li.append(r);
    }
    sum.querySelector('.tools-label').textContent = `Used ${tools.length} tool${tools.length > 1 ? 's' : ''}`;
    sum.querySelector('.tools-time').textContent = (total / 1000).toFixed(1) + 's';
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
        await stream(p, b.p, !gated && introRun ? 'stream' : null);
        gated = true;
      } else if (b.ul) {
        const ul = el('ul');
        ans.append(ul);
        for (const h of b.ul) { const li = el('li'); ul.append(li); await stream(li, h); }
      } else if (b.metrics) {
        const d = el('div', 'metrics');
        b.metrics.forEach(([v, l]) => {
          const m = el('span', 'metric pop', '<span class="mv"></span><span class="ml"></span>');
          m.querySelector('.mv').textContent = v;
          m.querySelector('.ml').textContent = l;
          d.append(m);
        });
        ans.append(d);
        await popIn(d.children);
      } else if (b.artifact) {
        const a = artifact(b.artifact);
        ans.append(a);
        await wait(30);
        a.classList.add('on');
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

  const followUps = (body, keys) => {
    const d = el('div', 'follow pop');
    d.setAttribute('role', 'group');
    d.setAttribute('aria-label', 'Suggested questions');
    keys.forEach((k) => {
      const b = el('button', 'fchip');
      b.type = 'button';
      b.innerHTML = '<span aria-hidden="true">↳</span> ';
      b.append(CHIP[k]);
      b.addEventListener('click', () => ask(k));
      d.append(b);
    });
    body.append(d);
    requestAnimationFrame(() => d.classList.add('on'));
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
    m.innerHTML = '<span class="mark mark-sm avatar" aria-hidden="true"><span class="mark-core"></span></span>';
    const body = el('div', 'msg-body');
    m.append(body);
    thread.append(m);
    return body;
  };

  const setBusy = (on) => {
    busy = on;
    root.classList.toggle('busy', on);
    thread.setAttribute('aria-busy', String(on));
    skipBtn.hidden = !on;
  };

  async function ask(key, typed, fromIntro) {
    if (busy && !fromIntro) { finishNow(); await currentRun; }
    const t = T[key];
    const id = ++runId;
    if (!fromIntro) { setBusy(true); newRun(); instant = reduce; }
    stick = true;
    $$('.side-topics button').forEach((b) => b.classList.toggle('active', b.dataset.k === key));
    currentRun = (async () => {
      addUser(typed || t.q);
      await wait(180);
      const body = addAgent();
      const th = el('p', 'thinking', 'Thinking');
      body.append(th);
      follow();
      await wait(380);
      th.remove();
      let det = null;
      if (t.tools.length) det = await runTools(body, t.tools);
      await wait(120);
      const ans = await renderBlocks(body, t.blocks);
      if (det) det.open = false;
      if (t.follow) followUps(body, t.follow);
      live.textContent = ans.textContent.replace(/\s+/g, ' ').trim().slice(0, 600);
      if (params.get('scroll') === 'end') { const end = () => window.scrollTo(0, document.documentElement.scrollHeight); end(); setTimeout(end, 800); }
      else if (instant && lastUser) lastUser.scrollIntoView({ block: 'start' });
      else follow();
    })();
    await currentRun;
    if (id === runId) { setBusy(false); instant = reduce; }
  }

  const typeInto = async (text) => {
    input.value = '';
    for (let i = 0; i < text.length; i++) {
      input.value += text[i];
      if (i === 9) await gate('typing');
      await wait(34);
    }
    await wait(220);
  };

  const welcome = () => {
    const w = el('section', 'welcome');
    w.innerHTML = `<span class="mark mark-lg" aria-hidden="true"><span class="mark-core"></span></span>
      <h1>Ask me about Tarun Sahnan</h1>
      <p>Full-stack engineer · backend and AI systems · Noida, remote</p>`;
    return w;
  };

  async function intro() {
    thread.replaceChildren(welcome());
    introRun = true;
    setBusy(true);
    newRun();
    instant = reduce || STATE === 'done';
    if (!instant) {
      await wait(500);
      await typeInto(T.who.q);
    }
    input.value = '';
    await ask('who', null, true);
    introRun = false;
  }

  function startAgent() {
    started = true;
    intro();
  }

  /* sidebar topics */
  const side = $('#side-topics');
  ['who', 'ai', 'backend', 'frontend', 'inspex', 'experience', 'skills', 'contact', 'why'].forEach((k) => {
    const li = el('li');
    const b = el('button');
    b.type = 'button';
    b.dataset.k = k;
    b.textContent = T[k].side;
    b.addEventListener('click', () => ask(k));
    li.append(b);
    side.append(li);
  });

  $('#restart').addEventListener('click', async () => {
    if (busy) { finishNow(); await currentRun; }
    window.scrollTo(0, 0);
    intro();
  });

  skipBtn.addEventListener('click', finishNow);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v || (busy && introRun)) return;
    input.value = '';
    ask(match(v), v);
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if (e.key === 'Escape') { if (busy) finishNow(); else if (typing) e.target.blur(); return; }
    if (typing) return;
    const agent = root.getAttribute('data-view') === 'agent';
    if (e.key === '/' && agent) { e.preventDefault(); input.focus(); }
    else if (e.key === 't' || e.key === 'T') toggleTheme();
    else if (e.key === 'v' || e.key === 'V') setView(agent ? 'classic' : 'agent');
  });

  onScroll();
  if (root.getAttribute('data-view') === 'agent') startAgent();

  console.log('tarun.sh is a scripted agent: hand-written answers, no LLM, no network calls. Say hi: ' + EMAIL);
})();
