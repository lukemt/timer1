# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Frontend (no build step). Key files:
  - `app/index.html`: Main document and UI structure
  - `app/main.js`: Timer logic, audio bells, theme toggle
  - `app/styles.css`: Layout, gradients, animations
- `app/assets/` (optional): Place images/audio here if added.
- Runtime helpers in repo root: `.server.log`, `.server.pid` (created when serving locally).

## Build, Test, and Development Commands
- Run locally (serves `app/` on 8080):
  - `python3 -m http.server 8080 -d app`
- Stop server (if started via shell script):
  - `kill $(cat .server.pid) && rm -f .server.pid`
- Open without a server (for quick preview):
  - `app/index.html` directly in a browser
- Format (recommended):
  - `npx prettier --write "app/**/*.{js,css,html}"`

## Coding Style & Naming Conventions
- Indentation: 2 spaces (HTML/CSS/JS).
- JavaScript: double quotes, semicolons; `camelCase` for vars/functions, `UPPER_SNAKE_CASE` for constants.
- Files: lowercase; use simple names like `index.html`, or kebab-case for new files (e.g., `theme-utils.js`).
- CSS: keep selectors shallow; prefer utility classes over deep nesting; use CSS variables defined in `:root`.

## Testing Guidelines
- No framework is configured. If adding tests, prefer lightweight unit tests with Vitest/Jest + jsdom.
- Test placement: `app/__tests__/` or alongside files as `*.spec.js`.
- Focus areas: time math (drift, pause/resume), accessibility (ARIA updates), and theme toggling.
- Run tests: via the chosen tool (e.g., `npx vitest`). Keep coverage reasonable for new code paths.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (e.g., `feat(timer): add progress ring`, `fix(ui): prevent overlap on small screens`).
- PRs: include a concise description, linked issues (`Closes #123`), before/after screenshots or short clip for UI changes, and notes on accessibility or performance if relevant.
- Keep PRs focused and under ~300 LOC when possible; include formatting changes in a separate commit.

## Security & Configuration Tips
- Do not commit secrets. For future config, add `.env.example` and ignore `.env*`.
- Static app: avoid embedding third‑party scripts without review; credit assets placed under `app/assets/`.
