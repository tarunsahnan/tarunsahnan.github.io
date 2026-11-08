# Tarun Sahnan — Full-stack Product Engineer

Personal portfolio. The classic one-page site is the HTML itself (what search
engines and no-JS visitors get). JavaScript then mounts an agent view on top:

- **ask tarun (agent view, default with JS):** a *scripted* chat agent. The first
  visit auto-asks "Who is Tarun Sahnan?", shows tool steps, then streams an answer
  with metric tiles, artifacts (diagrams, timeline, project card) and follow-up
  chips. Returning visitors get the answer instantly. On wide screens, artifacts
  open in a right-hand workspace panel next to the chat.
- Visitors can click topics, type a question (keyword-matched; unknown questions
  get an honest fallback), or **paste a job description**: `match_jd()` checks it
  against an explicit skill dictionary in `app.js` (`EVIDENCE`, `GAPS`) and shows
  evidence with links to proof, plus what is not on his record. Plain keyword
  matching, all in the browser.
- Every answer has **Copy link** (`?q=backend|ai|frontend|inspex|experience|stack|contact|why|jd`)
  and **View source** (the hand-written data behind it).
- No LLM, no API keys, no network calls, no tracking.
- **Classic view:** `?view=classic`, the "Classic view" button, or `V`.

Keys: `/` ask, `Esc` skip, `V` switch view, `T` theme (ignored while typing).
Light/dark follow the system. Reduced motion renders answers instantly.
Debug params: `?theme=light|dark`, `?state=typing|tools|stream|done`.

Résumé: there is no PDF in the repo. A commented-out link in the classic hero
marks where to add one.

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765.

## Files

- `index.html`: agent shell plus the classic content (intro, selected work, experience, projects, tools, contact).
- `style.css`: layout, theme tokens, responsive rules, reduced-motion support.
- `app.js`: the scripted agent (topics, keyword matching, streaming, tool-call UI), view and theme switching, copy-email.
- `favicon.svg`, `social-card.png`: icon and link preview (1200×630).

Diagrams are simplified illustrations of what each system does; they show no internals or private data.

## Checks

```sh
node --check app.js
git diff --check
```

Check desktop and 360px mobile (no horizontal scroll) in both themes, keyboard focus, and `prefers-reduced-motion`.
