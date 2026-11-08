# Tarun Sahnan — Full-stack Product Engineer

Personal portfolio. Calm, content-first, single column, light and dark
themes (system default, manual toggle with the button or `T`). Case studies
include small hand-drawn SVG diagrams, with separate narrow-screen versions.
Static HTML/CSS/vanilla JS on GitHub Pages, no build step, no dependencies
(Geist fonts from Google Fonts).

Append `?theme=dark` or `?theme=light` to the URL to force a theme for previews.

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765.

## Files

- `index.html`: all content (intro, selected work, experience, projects, tools, contact).
- `style.css`: layout, theme tokens, responsive rules, reduced-motion support.
- `app.js`: theme toggle, copy-email, active nav, gentle scroll entrance.
- `favicon.svg`, `social-card.png`: icon and link preview (1200×630).
- `Tarun-Sahnan-Full-Stack.pdf`: older résumé, not linked from the page.

Diagrams are simplified illustrations of what each system does; they show no internals or private data.

## Checks

```sh
node --check app.js
git diff --check
```

Check desktop and 360px mobile (no horizontal scroll) in both themes, keyboard focus, and `prefers-reduced-motion`.
