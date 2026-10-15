# Tarun Sahnan — Full Stack Engineer

A dependency-free, interactive portfolio hosted on GitHub Pages.

## Local preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. No build step or package installation is needed.

## Files

- `index.html`: portfolio content, interactive product stack, project showcases and dialogs.
- `style.css`: responsive layout, CSS product illustrations and reduced-motion support.
- `app.js`: stack interaction, project details, clipboard action and command menu.
- `Tarun-Sahnan-Full-Stack.pdf`: downloadable full-stack résumé.
- `social-card.png`: link-sharing preview.

Project details are defined in `projects` in `app.js`. Product visuals are simplified illustrations; they do not use private STAGE data or connect to production APIs.

## Verification

```sh
node --check app.js
git diff --check
```

Manually check desktop and mobile layouts, the expand/collapse stack interaction, all project dialogs, approach expanders, keyboard navigation, command search, résumé download and clipboard action. Respect `prefers-reduced-motion`. This static repository has no dependency-based build or lint command.

## Deployment

GitHub Pages publishes the repository root from `main`. Changes go through a feature branch and pull request.
