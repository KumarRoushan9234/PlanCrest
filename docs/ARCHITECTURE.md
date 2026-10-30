# Architecture

PlanCrest is a single page React app talking to an Express JSON API backed by MongoDB.

```
Browser (React, Vite build)
   │  HTTPS, JSON, httpOnly session cookie
   ▼
Express API  ──►  MongoDB (Mongoose)
   │
   ├─► Cloudinary        file and avatar storage
   ├─► SMTP (Gmail etc.) verification, invites, reminders
   ├─► OpenRouter        AI Mode (model set by OPENROUTER_MODEL)
   └─► Google, GitHub, Slack, Teams, Jira, Trello   integrations
```

## Server (`server/`)

| Folder | What lives there |
| --- | --- |
| `app.js` | Security middleware (helmet, CORS, origin check, rate limits), body parsing, auto mounting of every file in `routes/` |
| `config/` | Environment loading (`.env`, then optional `config.local.json`), Cloudinary and Firebase setup |
| `routes/` | Thin route files: path, middleware chain, controller |
| `controllers/` | Request handlers |
| `middlewares/` | Auth (`requireSignin`), access control (`permissions.js`, `resourceAccess.js`), security |
| `models/` | Mongoose schemas |
| `integrations/` | Provider registry, OAuth flow, encrypted token storage, provider actions, webhooks, notification fan out |
| `utils/` | Email, activity log, AI client and tools, automation engine, task helpers |
| `scripts/` | `dev-demo.js` (in-memory MongoDB with demo data) and `seed-demo.js` |
| `tests/` | `node:test` + `supertest` suite against an in-memory MongoDB |

### Authentication and access control

- Sign in returns a JWT in an httpOnly cookie (`SameSite=None; Secure` in production). The API also accepts `Authorization: Bearer`.
- Workspace roles: owner, admin, member, client. Project roles: admin, member, viewer.
- Routes that address a child resource (`/tasks/:id`, `/subtasks/:id`, ...) resolve its project first and then run the same membership checks as `/projects/:id` routes, so every path enforces the same rules.
- State changing requests from untrusted browser origins are rejected (`verifyOrigin`), which protects the cookie session from CSRF.

### Integrations

Each provider is declared once in `integrations/registry.js` with its auth type (`oauth`, `credentials`, `webhook`), scope (personal or workspace) and actions. The client hub reads the catalog from `GET /api/integrations`, so a new provider appears automatically.

- OAuth groups share one callback: `{API_PUBLIC_URL}/api/integrations/{google|github|slack}/callback`, with a signed state parameter.
- Tokens and secrets are encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY`.
- User supplied URLs (Jira base URL, webhook URLs) are checked so private and metadata addresses are rejected.
- Actions run through one endpoint: `POST /api/integrations/connectors/:id/actions/:action`.

### Work management features

- **Tasks** have status, priority, dates, assignees, labels, subtasks, comments, a discussion thread, custom field values, a repeat rule and `blockedBy` dependencies.
- **Automations** (`models/automation.js`, `utils/automationEngine.js`) run after task events: created, status changed, priority changed, assigned. Actions: set status, set priority, assign, tag, comment, notify.
- **Recurring tasks** create the next occurrence when the current one is completed.
- **Dependencies** block completion while a blocker is open, and circular links are rejected.
- **Time tracking** keeps one running timer per user; the timesheet aggregates entries per day.
- **Goals** combine numeric, task based and yes/no targets into a progress percentage.

### AI Mode

`utils/ai/client.js` calls OpenRouter's OpenAI compatible chat completions API. The assistant runs a tool loop (`utils/ai/workspaceTools.js`) that can list projects, find tasks, read a task and create tasks, always scoped to what the signed in user can access. Usage is recorded per workspace in `AiUsage`, and requests are rate limited per user.

## Client (`client/`)

| Folder | What lives there |
| --- | --- |
| `src/App.jsx` | Routes |
| `src/components/ui` | Design system primitives (buttons, cards, modals, tabs, charts) |
| `src/components/shell` | Top bar, side nav, command palette, notifications, timer chip |
| `src/styles` | `base.css` (theme variables for dark and light), `components.css`, `shell.css`, `brand.css` (landing and auth) |
| `src/pages` | One file per screen |
| `src/services` | API clients |
| `src/contexts` | Auth, workspace and project state |

Theme colours are CSS variables, and Tailwind's gray scale is mapped onto them, so both themes apply everywhere.
