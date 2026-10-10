'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const projects = {
  agent: { title: 'One user. One agent.', kicker: 'STAGE / AI SYSTEMS / IN PROGRESS', intro: 'Building a system that gives every user a dedicated AI agent.', ownership: 'Architecture and implementation end to end. This is current work at STAGE, extending my ownership from web products into AI agent systems.', stack: ['AI agents', 'System architecture', 'Backend engineering'], result: 'Currently in development. The lab offers a conceptual illustration, not a live connection to the production system.' },
  campaign: { title: 'The in-house campaign engine.', kicker: 'STAGE / BACKEND + DATA + FRONTEND', intro: 'Built an alternative to CleverTap myself, from the campaign interface to the systems that execute campaigns.', ownership: 'Frontend application, NestJS APIs, operational data, analytics events, audience profiles, Kafka consumers, Temporal workflows, authentication, testing and deployment.', stack: ['HTML + JavaScript SPA', 'Tailwind CSS', 'Node.js', 'TypeScript', 'NestJS', 'Express', 'PostgreSQL', 'ClickHouse', 'Kafka', 'Temporal', 'Docker Compose', 'Nginx', 'JWT', 'Jest + Supertest'], result: 'An end-to-end, self-hosted campaign platform with event ingestion, audience data and campaign execution under our own control.' },
  web: { title: 'The STAGE web platform.', kicker: 'STAGE / FULL-STACK PRODUCT OWNERSHIP', intro: 'Solely developed the entire STAGE website frontend in Next.js App Router and own the systems around it.', ownership: 'Architecture, routing, data fetching, SSR / SSG / ISR, accessibility, Cypress tests, performance, rollout and the web conversion funnel. Leading a team of three members and responding to web production incidents.', stack: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Cypress', 'AWS', 'CDN caching', 'AppsFlyer', 'Meta CAPI'], result: 'Lighthouse performance improved from about 58 to 90; LCP from 7s to 3s. Web-to-app install conversion improved from 27% to 42%, and subscription rate doubled.' },
  video: { title: 'Video, on our own terms.', kicker: 'STAGE / VIDEO + INFRASTRUCTURE', intro: 'Built a self-hosted FFmpeg video-transcoding pipeline on bare-metal servers, replacing AWS MediaConvert.', ownership: 'The transcoding pipeline, no-downtime re-transcodes, gradual rollout by platform and a live ClickHouse health dashboard. Connecting backend execution with operational visibility.', stack: ['FFmpeg', 'HLS', 'H.264 / H.265', 'Bare-metal servers', 'ClickHouse', 'Video delivery'], result: 'A self-hosted video pipeline with controlled migration and visibility into system health.' },
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

const universe = $('#universe');
const planets = $$('.planet');
const connections = $('#connections');
planets.forEach((planet) => {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '300');
  line.setAttribute('y1', '235');
  connections.append(line);
});
function drawMap() {
  planets.forEach((planet, index) => {
    planet.style.left = `${planet.dataset.x}%`;
    planet.style.top = `${planet.dataset.y}%`;
    connections.children[index].setAttribute('x2', String(Number(planet.dataset.x) * 6));
    connections.children[index].setAttribute('y2', String(Number(planet.dataset.y) * 4.8));
  });
}
const initialPositions = planets.map((planet) => [planet.dataset.x, planet.dataset.y]);
planets.forEach((planet) => {
  let drag = null;
  planet.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, left: Number(planet.dataset.x), top: Number(planet.dataset.y), moved: false };
    planet.dataset.dragged = 'false';
    planet.setPointerCapture(event.pointerId);
  });
  planet.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) < 6 && !drag.moved) return;
    drag.moved = true;
    planet.classList.add('dragging');
    const bounds = universe.getBoundingClientRect();
    const marginX = (planet.offsetWidth / 2 + 4) / bounds.width * 100;
    const marginY = (planet.offsetHeight / 2 + 4) / bounds.height * 100;
    planet.dataset.x = String(Math.max(marginX, Math.min(100 - marginX, drag.left + dx / bounds.width * 100)));
    planet.dataset.y = String(Math.max(marginY, Math.min(100 - marginY, drag.top + dy / bounds.height * 100)));
    drawMap();
  });
  const stopDrag = () => {
    if (drag) planet.dataset.dragged = String(drag.moved);
    drag = null;
    planet.classList.remove('dragging');
  };
  planet.addEventListener('pointerup', stopDrag);
  planet.addEventListener('pointercancel', stopDrag);
  planet.addEventListener('keydown', () => { planet.dataset.dragged = 'false'; });
});
$('#reset-map').addEventListener('click', () => {
  planets.forEach((planet, index) => {
    [planet.dataset.x, planet.dataset.y] = initialPositions[index];
    planet.dataset.dragged = 'false';
  });
  drawMap();
  toast('The universe is back in order.');
});
drawMap();

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

const demos = {
  campaign: { title: 'Send a signal.\nWatch it travel.', description: 'A user event moves through ingestion, audience matching and campaign execution.', range: 'Events per burst', action: 'Send events', metric: 'EVENTS PROCESSED', nodes: ['Kafka', 'ClickHouse', 'Temporal'], labels: ['INGEST', 'MATCH', 'EXECUTE'], symbols: ['⌁', '▤', '↗'], steps: ['Ingesting events into the stream…', 'Matching events to an audience…', 'Executing the campaign workflow…'], complete: (n) => `${n} demo events travelled from ingestion to execution.` },
  agent: { title: 'Not one for all.\nOne for each.', description: 'Explore the one-to-one relationship: each simulated user is paired with a dedicated agent.', range: 'Users to pair', action: 'Create agents', metric: 'DEDICATED AGENTS', nodes: ['Users', 'Pairing', 'Agents'], labels: ['INDIVIDUALS', 'ONE TO ONE', 'DEDICATED'], symbols: ['◉', '⇄', '✳'], steps: ['Creating demo users…', 'Assigning one agent to each user…', 'Checking every user-agent pairing…'], complete: (n) => `${n} users. ${n} dedicated agents. Every user has a pair.` },
  video: { title: 'One source.\nMany screens.', description: 'A simplified view of a video pipeline: source files become adaptive streaming renditions.', range: 'Source videos', action: 'Transcode videos', metric: 'HLS RENDITIONS', nodes: ['Source', 'FFmpeg', 'HLS'], labels: ['INGEST', 'TRANSCODE', 'DELIVER'], symbols: ['▷', '▥', '▣'], steps: ['Queueing source videos…', 'Encoding three renditions per video…', 'Preparing adaptive streaming output…'], complete: (n) => `${n} sources → ${n * 3} demo renditions: 1080p, 720p and 480p.` }
};
let activeDemo = 'campaign';
let demoTimer;
let demoTotal = 0;
const range = $('#demo-range');
const runButton = $('#run-demo');
function setDemo(key) {
  clearTimeout(demoTimer);
  activeDemo = key;
  demoTotal = 0;
  const demo = demos[key];
  $('.demo-stage').classList.remove('running');
  runButton.disabled = false;
  $('#demo-title').textContent = demo.title;
  $('#demo-title').style.whiteSpace = 'pre-line';
  $('#demo-description').textContent = demo.description;
  $('#range-label').textContent = demo.range;
  runButton.textContent = `${demo.action} ↗`;
  $('#metric-label').textContent = demo.metric;
  $('#metric-value').textContent = '000';
  $('#system-state').textContent = 'Ready_';
  $('#event-log').textContent = '› Change the parameters, then start the simulation.';
  ['a', 'b', 'c'].forEach((suffix, index) => {
    $(`#node-${suffix}`).textContent = demo.nodes[index];
    $(`#label-${suffix}`).textContent = demo.labels[index];
    $(`#symbol-${suffix}`).textContent = demo.symbols[index];
  });
  $$('[data-demo]').forEach((tab) => {
    const selected = tab.dataset.demo === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  $('#demo-panel').setAttribute('aria-labelledby', `tab-${key}`);
}
$$('[data-demo]').forEach((tab, index, tabs) => {
  tab.addEventListener('click', () => setDemo(tab.dataset.demo));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    setDemo(tabs[next].dataset.demo);
  });
});
range.addEventListener('input', () => { $('#range-output').value = range.value; });
runButton.addEventListener('click', () => {
  const demo = demos[activeDemo];
  const amount = Number(range.value);
  const increment = activeDemo === 'video' ? amount * 3 : amount;
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 60 : 700;
  runButton.disabled = true;
  runButton.textContent = 'Running…';
  $('.demo-stage').classList.add('running');
  $('#system-state').textContent = 'Working';
  let step = 0;
  const advance = () => {
    if (step < demo.steps.length) {
      $('#event-log').textContent = `› ${demo.steps[step]}`;
      step += 1;
      demoTimer = setTimeout(advance, duration);
      return;
    }
    demoTotal += increment;
    $('#metric-value').textContent = String(demoTotal).padStart(3, '0');
    $('#system-state').textContent = 'Complete';
    $('#event-log').textContent = `✓ ${demo.complete(amount)}`;
    $('.demo-stage').classList.remove('running');
    runButton.disabled = false;
    runButton.textContent = `${demo.action} ↗`;
  };
  advance();
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
    toast(text);
  }
}
$('.copy-email').addEventListener('click', () => copyText('tarunsahnan98@gmail.com', 'Email copied. Let’s make something good.'));
$('#share-lab').addEventListener('click', async () => {
  const url = 'https://tarunsahnan.github.io/#lab';
  if (navigator.share) {
    try { await navigator.share({ title: 'Tarun Sahnan — The systems playground', text: 'A full-stack portfolio you can play with.', url }); }
    catch (error) { if (error.name !== 'AbortError') await copyText(url, 'Playground link copied. Pass the curiosity on.'); }
  } else await copyText(url, 'Playground link copied. Pass the curiosity on.');
});
$('#back-top').addEventListener('click', () => { location.hash = 'top'; });
$('#year').textContent = String(new Date().getFullYear());

const commandDialog = $('#command-dialog');
const commandSearch = $('#command-search');
const commands = [
  { title: 'Explore the work', detail: 'Selected systems', href: '#work' },
  { title: 'Play in the lab', detail: 'Interactive demos', href: '#lab' },
  { title: 'Meet the human', detail: 'About & experience', href: '#about' },
  { title: 'See side projects', detail: 'After-hours department', href: '#side-projects' },
  { title: 'Get in touch', detail: 'Let’s build something', href: '#contact' },
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
