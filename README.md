# Tarun Sahnan — Full-stack Product Engineer

Personal portfolio with two views of the same content:

- **Agent view (default):** `tarun.sh`, a *scripted* chat agent. It auto-asks
  "Who is Tarun Sahnan?", shows tool-call steps, then streams an answer with
  metric chips, diagram/timeline/project "artifacts" and follow-up chips.
  Visitors can click chips or type; typed questions are matched to topics by
  keywords, and unknown questions get an honest fallback. There is no LLM,
  no API key, no network call and no tracking. Every answer is hand-written
  in `app.js` from Tarun's real work.
- **Classic view:** the full page in one scroll (`?view=classic`, the
  "Classic view" button, or `V`). This is also what renders without JS, so
  all content is in the HTML for SEO.

Light and dark themes follow the system; toggle with the button or `T`.
Keys: `/` focus the composer, `Esc` skip the animation, `V` switch view.
Animations are skipped under `prefers-reduced-motion`.

Debug and preview params: `?theme=light|dark`, `?view=agent|classic`,
`?state=typing|tools|stream|done` (freezes the intro at that point).

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
- `Tarun-Sahnan-Full-Stack.pdf`: older résumé, not linked from the page.

Diagrams are simplified illustrations of what each system does; they show no internals or private data.

## Checks

```sh
node --check app.js
git diff --check
```

Check desktop and 360px mobile (no horizontal scroll) in both themes, keyboard focus, and `prefers-reduced-motion`.
