# PlanCrest: Redesign & Completion Plan

Working copy: `C:\Users\roush\OneDrive\Desktop\Self_projects\Plancrest`
Design reference (READ-ONLY, never modified): `C:\Users\roush\OneDrive\Desktop\KEIRO_Main(working)\RenderData_keirolabs\frontend`

## 0. Guardrails

1. Only files inside `Self_projects\Plancrest` are created or changed. The two KEIRO folders are
   analysed (read only). No installs, builds, or file writes happen there.
2. Keiro's *design language* is reused (palette, layout, density, component patterns). Its brand is
   not: PlanCrest gets its own logo mark, name and copy.
3. No other folder on the machine is touched (the old `Desktop\Plancrest` is left as it is).
4. Secrets: `.env` files stay out of the public repo; `.env.example` files are added.
5. Every phase ends green: `eslint` 0 errors, `vite build` passes, server boots, smoke test passes.

## 1. What the Keiro design is (analysis)

The Keiro frontend has **two visual tiers** that share one DNA.

### Tier A, "Console" (everything after sign-in), the part we adopt most
| Aspect | Keiro value |
|---|---|
| Surface | blue-black: bg `#0c0d11`, panel `#121318`, raised `#181a21`, inset `#08090c`, hover `#16181f` |
| Lines | `#1f222b` hairlines, `#2a2e39` stronger; **no shadows**, borders do the work |
| Text | `#ececef` / sub `#9ea2ae` / dim `#6c7180` |
| Accent | primary blue `#2563eb` (hover `#1d4ed8`), links `#4d8dff`, icon tint `#7ea6f5` on `rgba(77,141,255,.08)` badges |
| Status | green `#3fb97f`/`#6fdb9f`, red `#e5675f`/`#ff8f8a`, chart ok `#3987e5`, bad `#d03b3b` |
| Type | Inter 13.5px/1.5 body, 600-weight titles (20-22px, `-0.015em`), JetBrains Mono for ids/code, `tabular-nums` for numbers |
| Shell | 48px top bar (brand / account crumb, centred search pill with `Ctrl K`, right: docs + avatar) over a body grid `220px sidebar | main` |
| Sidebar | text-labelled groups ("Automate", "Developers", "Account"), 30px rows, active = raised pill + blue icon |
| Main | `overflow-y:auto`, faint blue radial glow at the top (`radial-gradient(1000px 380px at 80% -140px, rgba(37,99,235,.07))`) |
| Cards | 8px radius, 1px border, 14-16px padding, header = small blue icon badge + 14px h2 + right-aligned link |
| Controls | 30px buttons (6px radius), 34px inputs, segmented controls, status dots, pills |
| Data | KPI strip (4 cells, 22px numbers + 11.5px note), SVG bar charts with hover tooltip, dense tables (11.5px header, 8px rows) |
| Patterns | "Set up" checklist card with progress bar, command palette (`Ctrl K`), toasts, modals (blurred overlay), empty states with one action, upgrade/plan card |
| Docs/Playground | Cloudflare-style 3-pane docs, Postman-style workbench |

### Tier B, "Brand" (login and landing)
Warm dark `#08070b` with soft lavender/sky radial glows, **Urbanist** headings (800/900), 18px-radius
card, topographic **contour-line SVG** backdrop, pink/lavender buttons, a gradient logo mark.

### Mapping to PlanCrest
* Tier A drives the whole signed-in app: Overview, Projects, Task Board, Calendar, Chat, Documents,
  Team, Analytics, Activity, Integrations, AI Mode, Settings.
* Tier B drives Landing, Login, Register, Verify, Forgot, Reset, Invite, which now also share one
  `AuthShell` so the "non-auth" and auth pages look like one product.
* PlanCrest accent stays **blue** for product UI. Lavender/pink appears only on brand surfaces and
  the AI feature (sparkle badge), giving AI Mode its own identity inside the blue console.

## 2. Current PlanCrest state

* ~100 components styled with inline Tailwind (`bg-gray-800`, `rounded-lg`, purple/blue mix).
  Shell = fixed `Navbar` + icon `Sidebar` + per-page `*TopNav` + per-page right drawers.
* Security/auth/AI-backend work from the previous session is already in this copy.
* Remaining product gaps: demo data on Overview/Activity, Google token refresh, Outlook sync,
  "Coming Soon" Activity panel, channel settings TODO, Documents wiring, no tests/CI/README.

## 3. Strategy: three layers (so 100+ files get re-skinned without 100 rewrites)

1. **Token layer.** Tailwind v4 `@theme` re-maps `gray-*`, `blue-*`, `purple-*`, radius and fonts to the
   Keiro palette. Every existing `bg-gray-800 border-gray-700` instantly becomes blue-black.
2. **Primitive layer.** A `pc-*` CSS system + `components/ui/*` React primitives (Button, Card,
   PageHead, KPI, Seg, Badge, Modal, Field, Table, EmptyState, Spinner, Avatar, Logo, Contours,
   Icon helpers, CommandPalette).
3. **Screen layer.** Rebuild the shell and each page with the primitives, in priority order.
   Deep legacy components (GitHub page 4,900 lines, big sidebars) get token re-skin + targeted fixes.

## 4. Design system spec (`client/src/styles/`)

* `tokens.css`: CSS variables (`--bg --panel --panel-2 --inset --hover --line --line-2 --text --sub
  --dim --blue --blue-h --link --green --red --amber --brand-*`) + Tailwind `@theme` overrides.
* `base.css`: fonts, scrollbars (thin, 2a2e39), focus ring `0 0 0 3px rgba(77,141,255,.25)`, selection.
* `components.css`: `pc-btn(.primary .ghost .danger .sm .lg .block .icon)`, `pc-card`, `pc-head`,
  `pc-kpis`, `pc-seg`, `pc-badge/pill/status`, `pc-input/select/textarea/field`, `pc-table`,
  `pc-modal/overlay`, `pc-toast`, `pc-palette`, `pc-empty`, `pc-progress`, `pc-tabs`, `pc-avatar`.
* `shell.css`: top bar, sidebar, main glow, responsive drawer (<820px: sidebar slides in).
* `brand.css`: contours, auth shell, landing sections (Urbanist headings).
* Fonts via Google Fonts in `index.html`: Inter, Urbanist, JetBrains Mono (Poppins removed).
* Light/dark: console is dark-only (as Keiro). `prefers-reduced-motion` respected.
* Accessibility: visible focus, 4.5:1 text contrast on panels, `aria-*` on nav/modals, keyboard
  nav for palette/menus.

## 5. Information architecture (new sidebar)

```
Workspace   Overview · My work (task board) · Projects · Calendar
Collaborate Chat · Documents · Team
Insights    Analytics · Activity
Automate    AI Mode · Integrations (GitHub, Google Calendar/Drive/Meet, Gmail)
Account     Settings · Notifications
```
Top bar: logo / **workspace switcher** / `Search or jump to… Ctrl K` / notification bell /
"+ New" menu (task, project, event, doc) / avatar menu (profile, theme-free, sign out).
Per-page `*TopNav` bars collapse into a shared `PageHead` (title, crumbs, description, actions).
Existing right-hand drawers (task details, day, chat) are kept and restyled as `pc-drawer`.

## 6. Screen-by-screen plan

### Brand tier
| Screen | Plan |
|---|---|
| Landing | Sticky glass nav; hero (Urbanist 56px, contour backdrop, product preview mock built in CSS/SVG); feature grid (6); "AI that works inside your workspace" band; integrations strip; how-it-works (3 steps); FAQ; CTA; footer. Honest copy (no fake testimonials or fake stats). |
| Login / Register / Verify / Forgot / Reset | One `AuthShell`: contour card, logo, Google button only when configured, inline field errors, password strength meter, 6-box code input with paste support, resend cooldown timer, show/hide password. |
| Invite accept | Same shell; shows workspace + inviter. |
| 404 | Branded not-found page. |

### Console tier
| Screen | Plan |
|---|---|
| Overview | Keiro "o2" layout: header + plan/workspace badge + primary action; **KPI strip** (open tasks, due this week, overdue, completed 7d); **tasks-per-day bar chart** (SVG, hover tooltip); **Recent activity** table; right column: **Set up** checklist (create project, invite teammate, connect integration, try AI), **My tasks due**, **Workspace** card. All real data, proper empty states, no demo data. |
| Projects | Search + status filter + grid/list segmented toggle; project cards with progress bar, member avatars, open/overdue counts; create-project modal restyled. |
| Project detail | Header with key + status + actions; tabs (Board, Tasks, Members, Activity, Settings) as `pc-tabs`; board columns restyled; WIP limits. |
| Task board | Kanban with dense cards, priority dot, due chip, assignee avatars, quick filters, drag-and-drop kept. |
| Task detail | Two-pane (content + meta rail), subtasks checklist + **AI breakdown button**, comments, attachments, activity, linked GitHub items. |
| Calendar | Month/linear toggle, day drawer, create-event modal, availability, Google sync status. |
| Chat | 3-pane (channels / messages / details), unread badges, reactions, threads, file attach, mentions; channel settings modal (rename, topic, members, leave/archive). |
| Documents | Table/grid toggle, upload with progress, preview modal, rename/share/delete, search + type filter, empty state. |
| Team | Member table with role pills, invite modal, pending invitations, remove/change role. |
| Analytics | KPI strip + velocity/burnup/task-distribution charts (shared SVG chart kit). |
| Activity | Real feed with filters (type, person, project), grouped by day, load-more. |
| Integrations | Catalog cards with connect state; per-integration pages get header + status card + settings (existing logic preserved). |
| AI Mode | Already functional; restyled as three-tab workbench (Assistant / Plan my day / Task breakdown) + usage cards; tool-call "steps" shown as chips under replies; configuration-needed empty state. |
| Settings | Tabs: Profile, Security (password), Notifications, Workspace (name, delete), Integrations/Tokens. |
| Command palette | `Ctrl K`: jump to pages, search projects/tasks/people, quick actions ("New task…", "Plan my day"). |

## 7. Feature completion (product + backend)

1. Remove all mock/demo fallbacks; real empty states everywhere.
2. Google Calendar/Drive/Gmail/Meet **token refresh** (auto-refresh before calls, mark connector `error` on failure); Outlook: hide behind "Coming soon" flag unless implemented (decision at implementation time, see §10).
3. Activity panel + feed: server filters (`type`, `user`, `project`, `before` cursor) + UI.
4. Chat channel settings (rename/topic/members/archive) wired to existing endpoints.
5. Documents: verify upload/list/rename/share/delete flows, workspace permission checks.
6. Notifications: bell dropdown with unread count, mark all read, deep links.
7. Onboarding checklist backed by real signals (project exists, >1 member, connector, AI used).
8. Dashboard/overview endpoint: single `GET /workspaces/:id/overview` shape documented and tested.
9. Search endpoint for palette: `GET /workspaces/:id/search?q=` (projects, tasks, members, docs; permission-scoped).
10. API polish: consistent `{success,data,error}` where cheap, pagination on lists, input validation (zod) on write routes touched.

## 8. Quality, tests, repo readiness

* Server tests converted to ESM (`node:test` + `supertest` + `mongodb-memory-server`): auth, workspace
  access, task IDOR checks, calendar edit rules, AI route gating.
* Client: `vitest` for utils (messageFormatter XSS cases, date helpers) + build check.
* GitHub Actions (lint, build, test), Dockerfiles + `docker-compose.yml` (mongo + server + client),
  `.env.example` (server + client), README with screenshots, LICENSE (MIT), CONTRIBUTING,
  SECURITY, CODE_OF_CONDUCT, issue/PR templates. `.gitignore` rewritten so docs/images can be committed.
* Seed script: demo workspace with sample projects/tasks for screenshots and development.

## 9. Execution order

| # | Phase | Output | Exit check |
|---|---|---|---|
| 1 | Foundations | tokens/base/components CSS, fonts, Logo/Contours/Icon, ui primitives, toasts | build + lint, storybook-style `/ui-kit` dev route renders |
| 2 | Shell | `AppShell` (top bar, sidebar, PageHead, command palette, notification bell, mobile drawer), remove old Navbar/Sidebar/TopNavs from layout | every route renders inside new shell |
| 3 | Brand tier | Landing, AuthShell + 5 auth pages, invite, 404 | manual walkthrough via preview |
| 4 | Overview, Projects, Task board, Task detail | rebuilt on primitives | screenshots reviewed |
| 5 | Calendar, Chat, Documents, Team | restyled + gaps closed | |
| 6 | Analytics, Activity, Integrations, Settings, AI Mode | restyled + backend gaps | |
| 7 | Backend completion (§7) | endpoints + tests | server tests green |
| 8 | Repo readiness (§8) | CI, Docker, docs, seed | `docker compose up` boots |
| 9 | Full QA | lint/build/tests, responsive pass (375/768/1280/1920), keyboard pass | checklist signed off |

I start and stop the dev servers myself (Vite on 5173, API on 8000) and verify screens in the built-in
browser at each phase.

## 10. Decisions taken (free hand given)

* Accent: blue console + lavender AI/brand accents.
* Outlook sync: not implemented (needs Azure app registration); hidden behind a feature flag with an honest "Coming soon" card.
* No light theme in this pass (matches Keiro); tokens make one a later add-on.
* Public API docs/playground (Keiro-style) are deferred; personal API tokens are out of scope here.
* Keep `react-hot-toast` and `framer-motion`; restyle instead of replacing.
* Keep inline-Tailwind in deep legacy pages where the token remap already gives the right look; rebuild only where layout changes.
