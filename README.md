# Tarun Sahnan — Full Stack Engineer

A dependency-free, interactive portfolio hosted on GitHub Pages.

## Local preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. No build step or package installation is needed.

## Files

- `index.html`: semantic content, project cards, playground and dialogs.
- `style.css`: responsive layout, illustrations and reduced-motion support.
- `app.js`: draggable project map, project details, filters, simulations and command menu.
- `Tarun-Sahnan-Full-Stack.pdf`: downloadable full-stack résumé.
- `social-card.png`: link-sharing preview.

Project details are defined in `projects` in `app.js`. The playground is an illustrative client-side simulation; it does not use private STAGE data or connect to production APIs.

## Verification

```sh
node --check app.js
git diff --check
```

Manually check desktop and mobile layouts, project map drag/reset, all project dialogs, filters, all three simulations, tab switching during a run, keyboard navigation, command search, résumé download and clipboard/share actions. Respect `prefers-reduced-motion`. This static repository has no dependency-based build or lint command.

## Deployment

GitHub Pages publishes the repository root from `main`. Changes go through a feature branch and pull request.
