'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const projects = {
  agent: { title: 'One user. One agent.', kicker: 'STAGE / AI SYSTEMS / IN PROGRESS', intro: 'Building a recommendation system that gives every user a dedicated AI agent, shaped around their journey.', problem: 'Make recommendations that reflect a user’s own journey rather than a generic response.', decision: 'Build a dedicated agent path for each user. The architecture and product behaviour are still being developed.', ownership: 'I am the sole developer on 1U1A: product decisions, architecture and implementation end to end. This is current work at STAGE.', stack: ['AI agents', 'System architecture', 'Backend engineering'], result: 'Currently in development. No shipped outcome to report yet.' },
  campaign: { title: 'The in-house campaign engine.', kicker: 'STAGE / BACKEND + DATA + FRONTEND', intro: 'Built an alternative to CleverTap myself, from the campaign interface to the systems that execute campaigns.', problem: 'Third-party campaign tooling was costly and gave us less control over audience data and execution.', decision: 'Bring the path in-house: event ingestion, audience profiles, APIs and campaign execution connected as one system.', ownership: 'Frontend application, NestJS APIs, operational data, analytics events, audience profiles, Kafka consumers, Temporal workflows, authentication, testing and deployment.', stack: ['HTML + JavaScript SPA', 'Tailwind CSS', 'Node.js', 'TypeScript', 'NestJS', 'Express', 'PostgreSQL', 'ClickHouse', 'Kafka', 'Temporal', 'Docker Compose', 'Nginx', 'JWT', 'Jest + Supertest'], result: 'Reduced monthly tooling cost by ₹4 lakh while bringing event ingestion, audience data and campaign execution under our own control.' },
  web: { title: 'The STAGE web platform.', kicker: 'STAGE / FULL-STACK PRODUCT OWNERSHIP', intro: 'Solely developed the entire STAGE website frontend in Next.js App Router and own the systems around it.', problem: 'The first load was slow, and the web journey needed to carry users through to install or subscription.', decision: 'Treat rendering, caching, accessibility, testing and the conversion funnel as one product problem.', ownership: 'Architecture, routing, data fetching, SSR / SSG / ISR, accessibility, Cypress tests, performance, rollout and the web conversion funnel. Leading a team of three members and responding to web production incidents.', stack: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Cypress', 'AWS', 'CDN caching', 'AppsFlyer', 'Meta CAPI'], result: 'Lighthouse performance improved from about 58 to 90; LCP from 7s to 3s. Web-to-app install conversion improved from 27% to 42%, and subscription rate doubled.' },
  video: { title: 'Video, on our own terms.', kicker: 'STAGE / VIDEO + INFRASTRUCTURE', intro: 'Built a self-hosted FFmpeg video-transcoding pipeline on bare-metal servers, replacing AWS MediaConvert.', problem: 'Video transcoding cost grew with the catalogue, while the migration could not interrupt playback.', decision: 'Move encoding to our own servers with gradual rollout, re-transcodes without downtime and health visibility.', ownership: 'The transcoding pipeline, no-downtime re-transcodes, gradual rollout by platform and a live ClickHouse health dashboard. Connecting backend execution with operational visibility.', stack: ['FFmpeg', 'HLS', 'H.264 / H.265', 'Bare-metal servers', 'ClickHouse', 'Video delivery'], result: 'Reduced transcoding cost by approximately 70%, with a controlled migration and visibility into system health.' },
  tv: { title: 'Same builder. Bigger screens.', kicker: 'STAGE / SAMSUNG + LG TV', intro: 'Built Samsung TV and LG TV apps from scratch, taking the web experience into the living room.', problem: 'TV app releases could take about two months, slowing the product feedback loop.', decision: 'Adapt the web experience to remote-key navigation and add OTA updates for the TV platforms.', ownership: 'Adapting the web codebase, remote-key navigation, TV interactions and OTA updates for faster releases.', stack: ['Tizen OS', 'webOS', 'JavaScript', 'Remote navigation', 'OTA updates'], result: 'Reduced the release cycle from approximately two months to approximately two minutes through OTA updates.' },
  sword: { title: 'SWORD', kicker: 'PERSONAL PROJECT / IN PROGRESS', intro: 'A native desktop GUI for Claude Code. A dedicated workspace for building with an AI coding agent.', problem: 'Coding-agent work benefits from a focused desktop home.', decision: 'Explore a native multi-chat interface with readable markdown, code and authentication flow.', ownership: 'The desktop experience, multi-chat sidebar, markdown rendering, syntax highlighting and a zero-config authentication flow that detects an existing Claude login.', stack: ['Desktop UI', 'Claude Code', 'Shiki', 'Markdown', 'Authentication'], result: 'In progress. There is no public release linked here yet.' },
  citovo: { title: 'Citovo', kicker: 'PERSONAL PROJECT / IN PROGRESS', intro: 'An automated SEO and GEO platform that connects finding problems with taking action.', problem: 'An audit is less useful when it ends before implementation.', decision: 'Connect SEO findings to content and ready-to-use fix prompts for AI agents.', ownership: 'SEO audits, programmatic SEO, AI-generated blogs and ready-to-use fix prompts for AI agents.', stack: ['SEO', 'GEO', 'Automation', 'AI agents', 'Programmatic content'], result: 'In progress. Building the path from an audit to an actionable fix.' }
};

const projectDialog = $('#project-dialog');
function openProject(key) {
  const project = projects[key];
  if (!project) return;
  $('#project-title').textContent = project.title;
  $('#project-kicker').textContent = project.kicker;
  $('#project-intro').textContent = project.intro;
  $('#project-problem').textContent = project.problem;
  $('#project-decision').textContent = project.decision;
  $('#project-ownership').textContent = project.ownership;
  $('#project-result').textContent = project.result;
  $('#project-result-label').textContent = ['agent', 'sword', 'citovo'].includes(key) ? 'Current status' : 'The outcome';
  $('#project-stack').replaceChildren(...project.stack.map((name) => {
    const tag = document.createElement('span');
    tag.textContent = name;
    return tag;
  }));
  projectDialog.showModal();
  projectDialog.scrollTop = 0;
}

$$('[data-project]').forEach((button) => button.addEventListener('click', () => {
  openProject(button.dataset.project);
}));
$$('dialog').forEach((dialog) => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});

$('#stack-toggle').addEventListener('click', () => {
  const expanded = $('#product-stack').classList.toggle('expanded');
  $('#stack-toggle').setAttribute('aria-pressed', String(expanded));
  $('#stack-toggle-label').textContent = expanded ? 'Bring it together' : 'Pull it apart';
  $('#stack-description').textContent = expanded
    ? 'Interface. Systems. Operations. All part of the product.'
    : 'Good products connect the dots.';
});

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
$('#year').textContent = String(new Date().getFullYear());

const commandDialog = $('#command-dialog');
const commandSearch = $('#command-search');
const commands = [
  { title: 'Read the work', detail: 'Selected systems', href: '#work' },
  { title: 'About Tarun', detail: 'Experience and skills', href: '#about' },
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
