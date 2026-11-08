# Tarun Sahnan — Full-stack Product Engineer

Personal portfolio, styled as a streaming title page: career chapters are
**seasons**, case studies are **episodes**, side projects are **originals** and
skills are the **credits**. Static HTML/CSS/vanilla JS on GitHub Pages, no build
step, no dependencies (fonts from Google Fonts).

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765.

## Files

- `index.html`: all content (hero, episodes, seasons, originals, credits, contact).
- `style.css`: layout, theme tokens, responsive rules, reduced-motion support.
- `app.js`: season tabs, scroll reveal, "up next" countdown, copy-email, keyboard "remote" (`?`, `j`/`k`, `s`, `1`–`4`, `e`).
- `favicon.svg`, `social-card.png`: icon and link preview (1200×630).
- `Tarun-Sahnan-Full-Stack.pdf`: older résumé, not linked from the page.

Episode thumbnails and the Inspex mock are hand-drawn SVG/CSS illustrations, not screenshots, and use no private data.

## Checks

```sh
node --check app.js
git diff --check
```

Check desktop and 360px mobile (no horizontal scroll), keyboard focus, season tabs (arrow keys), the `?` dialog, and `prefers-reduced-motion`.
