# PlanCrest: notes for Claude Code and other AI assistants

Open source project management app. MERN stack, ES modules everywhere.

## Layout

- `client/`: React 19, Vite 7, Tailwind v4, react-router 7. Entry `src/main.jsx`, routes in `src/App.jsx`.
- `server/`: Express 5, Mongoose 7. Entry `server.js`, app wiring in `app.js`. Every file in `routes/` is mounted automatically under `/api` (see `ROUTE_PREFIXES` in `app.js` for exceptions).
- `server/integrations/`: provider registry, OAuth, actions and webhooks for Google, GitHub, Slack, Teams, Jira and Trello.
- `docs/`: architecture, deployment and screenshots.

## Commands

```bash
cd server && npm run dev:demo   # API on :8000 with an in-memory MongoDB and demo data
cd client && npm run dev        # web app on :5173
cd server && npm test           # node:test + supertest, uses an in-memory MongoDB
cd client && npm run lint && npm run build
```

Demo login: `alex@plancrest.demo` / `PlanCrest-demo-1` (only exists in the demo database).

## Conventions

- UI: use the primitives in `client/src/components/ui` (`PageHead`, `Card`, `Button`, `Modal`, `Badge`...) and the `pc-*` classes in `client/src/styles`. Colours come from CSS variables in `styles/base.css`, so both light and dark themes keep working. Do not hardcode hex colours in components.
- Every signed-in page renders inside `components/common-afterauth/Layout.jsx`.
- API calls go through `client/src/services/*`. The base URL is `config/api.js` (`VITE_API_URL`).
- Server access control: use the middlewares in `middlewares/permissions.js` and `middlewares/resourceAccess.js` (`requireWorkspaceMember`, `requireProjectAccess`, `requireTaskAccess`, `canEditTask`...). Never trust ids from the body for authorization.
- Configuration comes only from environment variables (or `server/config.local.json`, which fills in missing ones). Add every new variable to `server/.env.example` and the README.
- AI Mode uses OpenRouter through `server/utils/ai/client.js`. The model is `OPENROUTER_MODEL`; do not hardcode a model.
- Add or update a test in `server/tests/` when changing API behaviour.

## Do not

- Commit `.env`, `config.local.json` or any credentials.
- Touch real user data while testing; use `npm run dev:demo`.
