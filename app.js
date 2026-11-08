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
  const form = $('#composer');
  const input = $('#ask');
  const skipBtn = $('#skip-run');
  const skipLink = $('.skip');
  const panelTabs = $('#panel-tabs');
  const panelBody = $('#panel-body');
  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');
  document.body.append(live);
  const DEFAULT_PLACEHOLDER = input.placeholder;

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
      follow: ['ai', 'backend', 'jd', 'inspex', 'experience', 'contact']
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
      follow: ['backend', 'jd', 'inspex', 'contact']
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
      follow: ['ai', 'frontend', 'jd', 'contact']
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
      follow: ['backend', 'jd', 'contact']
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
      follow: ['contact', 'jd', 'backend']
    },
    jd: {
      q: "I'd like to match a job description", side: null, chip: 'Match a job description',
      tools: [['match_jd.prepare()', 'ready · runs locally in your browser']],
      blocks: [
        { p: 'Paste the job description into the box below and press Enter. I\'ll check it against a fixed list of skills with evidence in his work, right here in your browser. Nothing is sent anywhere.' }
      ],
      follow: null
    },
    hello: {
      q: '', side: null, tools: [],
      blocks: [{ p: "Hi! I'm a scripted agent that knows Tarun's work. Ask about his AI work, backend systems, projects or experience, or pick one:" }],
      follow: ['who', 'ai', 'backend', 'jd', 'contact']
    },
    unknown: {
      q: '', side: null, tools: [],
      blocks: [{ p: "I only know what's in Tarun's work history and projects, so I can't answer that one. Try one of these:" }],
      follow: ['who', 'ai', 'backend', 'inspex', 'experience', 'contact']
    }
  };
  const DEEP = { who: 'who', ai: 'ai', backend: 'backend', frontend: 'frontend', inspex: 'inspex', experience: 'experience', stack: 'skills', skills: 'skills', contact: 'contact', why: 'why', jd: 'jd' };
  const DEEP_NAME = { skills: 'stack' };

  /* ---------- keyword matching for typed questions ---------- */
  const KEYS = {
    ai: ['ai', 'agent', 'agents', 'llm', 'gpt', 'claude', 'ml', 'machine learning', '1u1a', 'recommend', 'whatsapp', 'voice', 'paywall', 'chatbot', 'bhumi', 'genai'],
    backend: ['backend', 'back-end', 'api', 'apis', 'nest', 'nestjs', 'node', 'kafka', 'clickhouse', 'temporal', 'postgres', 'database', 'db', 'schema', 'pipeline', 'campaign', 's3', 'aws', 'infra', 'auth', 'login', 'system', 'systems', 'scale', 'server'],
    frontend: ['frontend', 'front-end', 'react', 'next', 'nextjs', 'website', 'web', 'tv', 'tizen', 'webos', 'samsung', 'lg', 'lighthouse', 'ui', 'performance', 'vue', 'seo'],
    inspex: ['inspex', 'side project', 'side projects', 'projects', 'project', 'product', 'products', 'startup', 'exam', 'sankalp', 'citovo', 'mca', 'company'],
    experience: ['experience', 'work history', 'job', 'jobs', 'career', 'stage', 'liberin', 'krishify', 'education', 'college', 'university', 'degree', 'cgpa', 'years', 'resume', 'cv'],
    skills: ['skill', 'skills', 'stack', 'tech', 'technologies', 'tools', 'languages', 'typescript', 'javascript', 'kotlin'],
    contact: ['contact', 'email', 'mail', 'reach', 'linkedin', 'github', 'call', 'phone', 'talk', 'message'],
    why: ['why', 'hire', 'hiring', 'strength', 'strengths', 'fit', 'should', 'good at', 'best'],
    jd: ['job description', 'jd', 'match', 'role description'],
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

  /* ---------- job-description matcher: explicit dictionary, no LLM ---------- */
  const EVIDENCE = [
    { k: 'Node.js', re: /\bnode(\.?js)?\b/, proof: 'Campaign platform; REST APIs at Liberin', topic: 'backend' },
    { k: 'NestJS', re: /\bnest\.?js\b|\bnestjs\b/, proof: 'Campaign platform', topic: 'backend' },
    { k: 'TypeScript', re: /typescript/, proof: 'Daily language across his stack', topic: 'skills' },
    { k: 'JavaScript', re: /javascript|\bes6\b/, proof: 'Web, TV apps, Node.js services', topic: 'skills' },
    { k: 'React', re: /\breact(\.?js)?\b(?!\s*native)/, proof: 'TV app rewrite; Bhumi frontend', topic: 'frontend' },
    { k: 'Next.js', re: /next\.?js/, proof: 'STAGE website from scratch', topic: 'frontend' },
    { k: 'Vue', re: /\bvue(\.?js)?\b/, proof: 'Vue 3 dashboard at Liberin', topic: 'experience' },
    { k: 'PostgreSQL / SQL', re: /postgres|\bsql\b/, proof: 'Campaign platform; promo-to-ad job queue', topic: 'backend' },
    { k: 'MongoDB', re: /mongo/, proof: 'Listed in his stack', topic: 'skills' },
    { k: 'Kafka', re: /kafka/, proof: 'Campaign platform', topic: 'backend' },
    { k: 'ClickHouse', re: /clickhouse/, proof: 'Campaign platform', topic: 'backend' },
    { k: 'Temporal / workflows', re: /temporal|workflow orchestration/, proof: 'Campaign platform retry workflows', topic: 'backend' },
    { k: 'AWS', re: /\baws\b|amazon web services|\bs3\b|cloudfront|amplify/, proof: 'S3 presigned uploads; signed URLs and cookies', topic: 'backend' },
    { k: 'REST APIs', re: /\brest(ful)?\b/, proof: 'Node.js services at STAGE and Liberin', topic: 'backend' },
    { k: 'GraphQL', re: /graphql/, proof: 'Listed in his stack', topic: 'skills' },
    { k: 'System design / scale', re: /system design|distributed|scalab|high[- ]traffic|event[- ]driven|microservice/, proof: '~100K agent generations a day; parallel pipelines', topic: 'backend' },
    { k: 'AI agents / LLMs', re: /\bllms?\b|\bai agents?\b|agentic|genai|generative ai|openai|anthropic|claude|langchain|\brag\b|prompt/, proof: '1U1A in production; agentic paywall', topic: 'ai' },
    { k: 'CI/CD', re: /github actions|ci\s*\/\s*cd|continuous integration/, proof: 'GitHub Actions', topic: 'skills' },
    { k: 'Testing', re: /\bjest\b|vitest|cypress|unit test|e2e|end-to-end test|test coverage|\btdd\b/, proof: 'Coverage 35% → 83% at Liberin', topic: 'experience' },
    { k: 'Payments', re: /razorpay|payment/, proof: 'Razorpay on Inspex', topic: 'inspex' },
    { k: 'Ads & attribution', re: /appsflyer|attribution|marketing api|meta ads|google ads|\bga4\b|amplitude|growth/, proof: 'Attribution across backend, web and Flutter', topic: 'backend' },
    { k: 'Observability', re: /datadog|signoz|observability|monitoring|crashlytics/, proof: 'Datadog, SigNoz, Crashlytics', topic: 'skills' },
    { k: 'Web performance / SEO', re: /lighthouse|web vitals|\bseo\b|page speed|\blcp\b/, proof: 'Lighthouse ~58 → ~90, LCP 7s → 3s', topic: 'frontend' },
    { k: 'Smart TV apps', re: /tizen|webos|smart tv|connected tv|\bctv\b/, proof: 'Samsung and LG TV apps', topic: 'frontend' },
    { k: 'Kotlin / Android', re: /kotlin|android/, proof: 'Android performance work at Krishify', topic: 'experience' },
    { k: 'Python', re: /python/, proof: 'Python automation on Inspex (side project)', topic: 'inspex', partial: true },
    { k: 'Product ownership', re: /ownership|end[- ]to[- ]end|product[- ]minded|0\s*(to|-)\s*1|founding/, proof: 'Sole developer of 1U1A; Inspex built solo', topic: 'why' }
  ];
  const GAPS = [
    { k: 'Java', re: /\bjava\b(?!\s*script)/ }, { k: 'Go', re: /\bgolang\b|\bgo (developer|engineer|services|backend)\b/ },
    { k: 'Rust', re: /\brust\b/ }, { k: 'Ruby / Rails', re: /\bruby\b|\brails\b/ }, { k: 'PHP', re: /\bphp\b|laravel/ },
    { k: 'C# / .NET', re: /c#|\.net\b/ }, { k: 'Kubernetes', re: /kubernetes|\bk8s\b/ }, { k: 'Docker', re: /docker/ },
    { k: 'Terraform / IaC', re: /terraform|infrastructure as code|\biac\b/ }, { k: 'GCP', re: /\bgcp\b|google cloud/ },
    { k: 'Azure', re: /azure/ }, { k: 'iOS / Swift', re: /\bswift\b|\bios\b/ }, { k: 'React Native', re: /react\s*native/ },
    { k: 'Django / FastAPI', re: /django|fastapi|flask/ }, { k: 'Redis', re: /redis/ }, { k: 'Elasticsearch', re: /elasticsearch|opensearch/ },
    { k: 'Spark / data engineering', re: /\bspark\b|airflow|data pipeline engineer/ }, { k: 'People management', re: /people manag|manage a team|engineering manager|lead a team|team lead/ }
  ];
  const matchJD = (raw) => {
    const t = raw.toLowerCase();
    const matched = EVIDENCE.filter((e) => e.re.test(t));
    const gaps = GAPS.filter((g) => g.re.test(t)).map((g) => ({ k: g.k, note: g.k === 'People management' ? 'No people-management role on his record' : 'Not listed in his work' }));
    const yrs = [...t.matchAll(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years|yrs)/g)].map((m) => +m[1]).filter((n) => n < 30);
    const want = yrs.length ? Math.max(...yrs) : null;
    if (want != null && want > 4) gaps.push({ k: `${want}+ years`, note: 'He has ~3.5 years (full-time since Jun 2023)' });
    return { matched, gaps, want, words: raw.trim().split(/\s+/).length };
  };
  const fitTopic = (raw) => {
    const r = matchJD(raw);
    const fit = () => {
      const d = el('div', 'fit');
      const col = (title, n, items) => {
        const c = el('div', 'fit-col');
        c.innerHTML = `<p class="fit-h">${title}<span>${n}</span></p>`;
        const ul = el('ul');
        items.forEach((li) => ul.append(li));
        if (!items.length) ul.append(el('li', 'fit-empty', 'None found in this text.'));
        c.append(ul);
        return c;
      };
      const mItems = r.matched.map((e) => {
        const li = el('li', e.partial ? 'partial' : '');
        li.innerHTML = '<span class="fit-k"></span><span class="fit-p"></span><button type="button" class="fit-go">Proof →</button>';
        li.querySelector('.fit-k').textContent = e.k + (e.partial ? ' (partial)' : '');
        li.querySelector('.fit-p').textContent = e.proof;
        li.querySelector('.fit-go').dataset.topic = e.topic;
        return li;
      });
      const gItems = r.gaps.map((g) => {
        const li = el('li', 'gap');
        li.innerHTML = '<span class="fit-k"></span><span class="fit-p"></span>';
        li.querySelector('.fit-k').textContent = g.k;
        li.querySelector('.fit-p').textContent = g.note;
        return li;
      });
      d.append(col('Evidence in his work', r.matched.length, mItems), col('Not on his record', r.gaps.length, gItems));
      return d;
    };
    const known = r.matched.length + r.gaps.length;
    const lead = known
      ? `I found <b>${known}</b> skill${known > 1 ? 's' : ''} I know about in that description: <b>${r.matched.length}</b> with evidence in his work, <b>${r.gaps.length}</b> not on his record.`
      : "I couldn't find any skills from my list in that text. Try pasting the full requirements section.";
    return {
      q: '', jd: true,
      tools: [[`match_jd({ words: ${r.words} })`, `${r.matched.length} with evidence · ${r.gaps.length} not on record`]],
      blocks: known ? [{ p: lead }, { artifact: { id: 'fit-' + Date.now(), title: 'Job description fit', kind: 'Fit map', icon: 'fit', build: fit } }, { p: 'This is plain keyword matching against a fixed list in the page source, so read it as a starting point, not a verdict.' }] : [{ p: lead }],
      follow: ['contact', 'backend', 'ai'],
      source: { tool: 'match_jd', dictionary: EVIDENCE.map((e) => e.k), gaps_checked: GAPS.map((g) => g.k) }
    };
  };

  /* ================= run engine: one run at a time, cancellable ================= */
  let runId = 0;
  let busy = false;
  let instant = reduce;
  let introActive = false;
  let introTyping = false;
  let jdMode = false;
  let currentRun = Promise.resolve();
  let skipNow = () => {};
  let skipP = Promise.resolve();
  const wait = (ms) => (instant ? Promise.resolve() : Promise.race([new Promise((r) => setTimeout(r, ms)), skipP]));
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
      if (i % 2 === 1) { await wait(22); follow(); }
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

  const followUps = (body, keys) => {
    const d = el('div', 'follow pop');
    d.setAttribute('role', 'group');
    d.setAttribute('aria-label', 'Suggested questions');
    keys.forEach((k) => {
      const b = el('button', 'fchip' + (k === 'jd' ? ' fchip-jd' : ''));
      b.type = 'button';
      b.dataset.topic = k;
      b.innerHTML = '<span aria-hidden="true">↳</span> ';
      b.append(T[k].chip);
      d.append(b);
    });
    body.append(d);
    requestAnimationFrame(() => d.classList.add('on'));
  };

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
    if (key === 'jd') armJD(opts.user);
    announce(t);
    if (params.get('scroll') === 'end') window.scrollTo(0, document.documentElement.scrollHeight);
    else if (instant && !opts.user && lastUser) lastUser.scrollIntoView({ block: 'start' });
    else follow();
    if (opts.user && key !== 'jd') { ans.setAttribute('tabindex', '-1'); ans.focus({ preventScroll: true }); }
  }

  /* Public entry: cancels whatever is running (including the intro), then answers. */
  async function ask(key, opts = {}) {
    const id = ++runId;
    if (introTyping) { introTyping = false; input.value = ''; }
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
        await wait(450);
        if (id !== runId) return;
        introTyping = true;
        const q = T.who.q;
        for (let i = 0; i < q.length; i++) {
          input.value += q[i];
          if (i === 9) await gate('typing');
          await wait(34);
          if (id !== runId || !introTyping) return;
        }
        await wait(200);
        if (id !== runId || !introTyping) return;
        introTyping = false;
      }
      input.value = '';
      await answer('who', T.who, {});
      store.set('introSeen', '1');
    })();
    await currentRun;
    introActive = false;
    introTyping = false;
    if (id === runId) stopRun();
  }

  const armJD = (focus) => {
    jdMode = true;
    root.classList.add('jd-mode');
    input.placeholder = 'Paste the job description, press Enter…';
    if (focus) input.focus({ preventScroll: true });
  };
  const disarmJD = () => {
    jdMode = false;
    root.classList.remove('jd-mode');
    input.placeholder = DEFAULT_PLACEHOLDER;
  };

  const welcome = () => {
    const w = el('section', 'welcome');
    w.setAttribute('aria-labelledby', 'welcome-t');
    w.innerHTML = `<span class="mark mark-xl" aria-hidden="true">ts<i></i></span>
      <h1 id="welcome-t">Tarun Sahnan</h1>
      <p class="welcome-tag">${TAGLINE}</p>
      <p class="welcome-level">${LEVEL}</p>`;
    return w;
  };

  function startAgent() {
    started = true;
    thread.replaceChildren(welcome());
    const deep = DEEP[(params.get('q') || '').toLowerCase()];
    if (deep) { store.set('introSeen', '1'); ask(deep, { instant: true }); }
    else if (store.get('introSeen') && !STATE) ask('who', { instant: true });
    else { if (!STATE) store.set('introSeen', '1'); intro(); }
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
    if (topic && app.contains(topic)) { disarmJD(); ask(topic.dataset.topic, { user: true }); return; }
    const vt = e.target.closest('[data-view-to]');
    if (vt) { setView(vt.dataset.viewTo); return; }
    if (e.target.closest('.theme-btn')) { toggleTheme(); return; }
    if (e.target.closest('[data-copy-email], #copy')) { copyEmail(); }
  });

  $('#replay').addEventListener('click', () => { disarmJD(); thread.replaceChildren(welcome()); window.scrollTo(0, 0); intro(); });
  skipBtn.addEventListener('click', finishNow);

  // typing over the auto-typed intro cancels it and hands the box to the visitor
  input.addEventListener('keydown', (e) => {
    if (!introTyping || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') return;
    if (e.key.length === 1 || e.key === 'Backspace') {
      introTyping = false;
      const cancelId = ++runId;
      instant = true;
      skipNow();
      input.value = '';
      currentRun.then(() => { if (runId === cancelId) stopRun(); });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (introTyping) { ask('who', { user: true }); return; } // Enter during the intro: answer now
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    if (jdMode || v.split(/\s+/).length > 40) {
      disarmJD();
      const t = fitTopic(v);
      const preview = v.replace(/\s+/g, ' ').slice(0, 120) + (v.length > 120 ? '…' : '');
      ask('jdResult', { user: true, topic: t, text: 'Job description: “' + preview + '”' });
      return;
    }
    ask(match(v), { user: true, text: v });
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (e.key === 'Escape') { if (busy) finishNow(); else if (typing) e.target.blur(); return; }
    if (typing) return;
    const agent = root.getAttribute('data-view') === 'agent';
    if (e.key === '/' && agent) { e.preventDefault(); input.focus(); }
    else if (e.key === 't' || e.key === 'T') toggleTheme();
    else if (e.key === 'v' || e.key === 'V') setView(agent ? 'classic' : 'agent');
  });

  wideMQ.addEventListener('change', () => { /* panel visibility is CSS-driven; nothing to rebuild */ });

  onScroll();
  applyView(root.getAttribute('data-view') === 'classic' ? 'classic' : 'agent');
  if (root.getAttribute('data-view') === 'agent') startAgent();

  console.log('ask tarun is a scripted agent: hand-written answers, no LLM, no network calls. Say hi: ' + EMAIL);
})();
