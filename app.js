'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const projects = {
  agent: { title: 'One user. One agent.', kicker: 'STAGE / AI SYSTEMS / IN PROGRESS', intro: 'Building a system that gives every user a dedicated AI agent.', ownership: 'Architecture and implementation end to end. This is current work at STAGE, extending my ownership from web products into AI agent systems.', stack: ['AI agents', 'System architecture', 'Backend engineering'], result: 'Currently in development. No shipped outcome to report yet.' },
  campaign: { title: 'The in-house campaign engine.', kicker: 'STAGE / BACKEND + DATA + FRONTEND', intro: 'Built an alternative to CleverTap myself, from the campaign interface to the systems that execute campaigns.', ownership: 'Frontend application, NestJS APIs, operational data, analytics events, audience profiles, Kafka consumers, Temporal workflows, authentication, testing and deployment.', stack: ['HTML + JavaScript SPA', 'Tailwind CSS', 'Node.js', 'TypeScript', 'NestJS', 'Express', 'PostgreSQL', 'ClickHouse', 'Kafka', 'Temporal', 'Docker Compose', 'Nginx', 'JWT', 'Jest + Supertest'], result: 'Reduced monthly tooling cost by ₹4 lakh while bringing event ingestion, audience data and campaign execution under our own control.' },
  web: { title: 'The STAGE web platform.', kicker: 'STAGE / FULL-STACK PRODUCT OWNERSHIP', intro: 'Solely developed the entire STAGE website frontend in Next.js App Router and own the systems around it.', ownership: 'Architecture, routing, data fetching, SSR / SSG / ISR, accessibility, Cypress tests, performance, rollout and the web conversion funnel. Leading a team of three members and responding to web production incidents.', stack: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Cypress', 'AWS', 'CDN caching', 'AppsFlyer', 'Meta CAPI'], result: 'Lighthouse performance improved from about 58 to 90; LCP from 7s to 3s. Web-to-app install conversion improved from 27% to 42%, and subscription rate doubled.' },
  video: { title: 'Video, on our own terms.', kicker: 'STAGE / VIDEO + INFRASTRUCTURE', intro: 'Built a self-hosted FFmpeg video-transcoding pipeline on bare-metal servers, replacing AWS MediaConvert.', ownership: 'The transcoding pipeline, no-downtime re-transcodes, gradual rollout by platform and a live ClickHouse health dashboard. Connecting backend execution with operational visibility.', stack: ['FFmpeg', 'HLS', 'H.264 / H.265', 'Bare-metal servers', 'ClickHouse', 'Video delivery'], result: 'Reduced transcoding cost by approximately 70%, with a controlled migration and visibility into system health.' },
  tv: { title: 'Same builder. Bigger screens.', kicker: 'STAGE / SAMSUNG + LG TV', intro: 'Built Samsung TV and LG TV apps from scratch, taking the web experience into the living room.', ownership: 'Adapting the web codebase, remote-key navigation, TV interactions and OTA updates for faster releases.', stack: ['Tizen OS', 'webOS', 'JavaScript', 'Remote navigation', 'OTA updates'], result: 'Reduced the release cycle from approximately two months to approximately two minutes through OTA updates.' },
  sword: { title: 'SWORD', kicker: 'PERSONAL PROJECT / IN PROGRESS', intro: 'A native desktop GUI for Claude Code. A dedicated workspace for building with an AI coding agent.', ownership: 'The desktop experience, multi-chat sidebar, markdown rendering, syntax highlighting and a zero-config authentication flow that detects an existing Claude login.', stack: ['Desktop UI', 'Claude Code', 'Shiki', 'Markdown', 'Authentication'], result: 'In progress. There is no public release linked here yet.' },
  citovo: { title: 'Citovo', kicker: 'PERSONAL PROJECT / IN PROGRESS', intro: 'An automated SEO and GEO platform that connects finding problems with taking action.', ownership: 'SEO audits, programmatic SEO, AI-generated blogs and ready-to-use fix prompts for AI agents.', stack: ['SEO', 'GEO', 'Automation', 'AI agents', 'Programmatic content'], result: 'In progress. Building the path from an audit to an actionable fix.' }
};

const projectDialog = $('#project-dialog');
function openProject(key) {
  const project = projects[key];
  if (!project) return;
  $('#project-title').textContent = project.title;
  $('#project-kicker').textContent = project.kicker;
  $('#project-intro').textContent = project.intro;
  $('#project-ownership').textContent = project.ownership;
  $('#project-result').textContent = project.result;
  $('#project-stack').replaceChildren(...project.stack.map((name) => {
    const tag = document.createElement('span');
    tag.textContent = name;
    return tag;
  }));
  projectDialog.showModal();
  projectDialog.scrollTop = 0;
}

$$('[data-project]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.dragged === 'true') {
    button.dataset.dragged = 'false';
    return;
  }
  openProject(button.dataset.project);
}));
$$('dialog').forEach((dialog) => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});

const buildNotes = {
  web: { count: '01 / 03', meta: 'STAGE / WEB', status: 'SHIPPED + MAINTAINED', title: 'Make the first visit count.', steps: ['Visitor', 'Next.js web', 'Subscriber'], decision: 'Own rendering, accessibility, performance and the conversion path as one product problem.', result: '27% → 42%', label: 'web-to-app conversion' },
  campaign: { count: '02 / 03', meta: 'STAGE / CAMPAIGNS', status: 'SHIPPED + MAINTAINED', title: 'Bring the campaign path in-house.', steps: ['Kafka events', 'ClickHouse profiles', 'Temporal jobs'], decision: 'Build the interface, event pipeline, audience data and execution together, instead of relying on a third-party tool.', result: '₹4L / month', label: 'tooling cost reduced' },
  video: { count: '03 / 03', meta: 'STAGE / VIDEO', status: 'SHIPPED + MAINTAINED', title: 'Transcode without the hand-off.', steps: ['Source', 'FFmpeg', 'HLS renditions'], decision: 'Move encoding to our own servers, with gradual rollout and health checks built into the migration.', result: '~70%', label: 'lower transcoding cost' }
};
function selectBuildNote(key) {
  const note = buildNotes[key];
  $('#note-count').textContent = note.count;
  $('.note-meta span').textContent = note.meta;
  $('#note-status').textContent = note.status;
  $('#note-title').textContent = note.title;
  [$('#note-step-a'), $('#note-step-b'), $('#note-step-c')].forEach((step, index) => { step.textContent = note.steps[index]; });
  $('#note-decision').textContent = note.decision;
  $('#note-result').textContent = note.result;
  $('#note-result-label').textContent = note.label;
  $('#note-panel').setAttribute('aria-labelledby', `note-tab-${key}`);
  $('#open-note').dataset.project = key;
  $$('[data-note]').forEach((tab) => {
    const selected = tab.dataset.note === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) $('#note-panel').animate([{ opacity: .62, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
}
$$('[data-note]').forEach((tab, index, tabs) => {
  tab.addEventListener('click', () => selectBuildNote(tab.dataset.note));
  tab.addEventListener('keydown', (event) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    next.focus();
    selectBuildNote(next.dataset.note);
  });
});

$$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-filter]').forEach((item) => {
    const selected = item === button;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  $$('[data-category]').forEach((card) => {
    card.hidden = button.dataset.filter !== 'all' && !card.dataset.category.split(' ').includes(button.dataset.filter);
  });
}));

let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
async function copyText(text, success) {
  try {
    await navigator.clipboard.writeText(text);
    toast(success);
  } catch {
    toast(`Clipboard unavailable. Copy manually: ${text}`);
  }
}
$('.copy-email').addEventListener('click', () => copyText('tarunsahnan98@gmail.com', 'Email copied. Let’s make something good.'));
$('#back-top').addEventListener('click', () => { location.hash = 'top'; });
$('#year').textContent = String(new Date().getFullYear());

const commandDialog = $('#command-dialog');
const commandSearch = $('#command-search');
const commands = [
  { title: 'Read the work', detail: 'Selected systems', href: '#work' },
  { title: 'Read the field notes', detail: 'Engineering decisions', href: '#notes' },
  { title: 'About Tarun', detail: 'Experience and approach', href: '#about' },
  { title: 'See side projects', detail: 'Independent work', href: '#side-projects' },
  { title: 'Get in touch', detail: 'Email and links', href: '#contact' },
  { title: 'Read my résumé', detail: 'Full stack · PDF', href: 'Tarun-Sahnan-Full-Stack.pdf' },
  { title: 'One user. One agent.', detail: 'AI systems', project: 'agent' },
  { title: 'Campaign engine', detail: 'NestJS · Kafka · Temporal', project: 'campaign' },
  { title: 'Video pipeline', detail: 'FFmpeg · HLS', project: 'video' }
];
let commandIndex = 0;
let matchedCommands = commands;
function activateCommand(index) {
  const command = matchedCommands[index];
  if (!command) return;
  commandDialog.close();
  if (command.project) openProject(command.project);
  else if (command.href.startsWith('#')) {
    location.hash = command.href;
    const section = $(command.href);
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
  } else window.open(command.href, '_blank', 'noopener');
}
function renderCommands() {
  const search = commandSearch.value.trim().toLowerCase();
  matchedCommands = commands.filter((command) => `${command.title} ${command.detail}`.toLowerCase().includes(search));
  commandIndex = 0;
  $('#command-results').replaceChildren(...matchedCommands.map((command, index) => {
    const button = document.createElement('button');
    button.className = `command-item${index === 0 ? ' selected' : ''}`;
    button.append(document.createTextNode(command.title));
    const detail = document.createElement('span');
    detail.textContent = command.detail;
    button.append(detail);
    button.addEventListener('click', () => activateCommand(index));
    return button;
  }));
  if (!matchedCommands.length) {
    const message = document.createElement('p');
    message.className = 'no-results';
    message.textContent = 'Nothing here yet. Try “work”, “agent” or “contact”.';
    $('#command-results').append(message);
  }
}
function openCommands() {
  if (projectDialog.open) projectDialog.close();
  if (commandDialog.open) return;
  commandSearch.value = '';
  renderCommands();
  commandDialog.showModal();
  commandSearch.focus();
}
$$('.command-trigger').forEach((button) => button.addEventListener('click', openCommands));
commandSearch.addEventListener('input', renderCommands);
commandSearch.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); activateCommand(commandIndex); }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !matchedCommands.length) return;
  event.preventDefault();
  commandIndex = (commandIndex + (event.key === 'ArrowDown' ? 1 : -1) + matchedCommands.length) % matchedCommands.length;
  $$('.command-item').forEach((button, index) => {
    button.classList.toggle('selected', commandIndex === index);
    if (commandIndex === index) button.scrollIntoView({ block: 'nearest' });
  });
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (commandDialog.open) commandDialog.close();
    else openCommands();
  }
});
