# Contributing to PlanCrest

Thanks for helping out! This guide keeps changes easy to review.

## Getting set up

1. Fork and clone the repo.
2. Follow the [Quick start](README.md#quick-start). `npm run dev:demo` in `server/` is the fastest way to a working app with sample data.
3. Create a branch from `main`: `git checkout -b feature/short-description`.

## Before you open a pull request

```bash
cd server && npm test
cd ../client && npm run lint && npm run build
```

- Keep pull requests focused: one feature or fix at a time.
- Add or update a test in `server/tests` when you change API behaviour.
- Match the surrounding code style. The UI uses the shared primitives in `client/src/components/ui` and the `pc-*` classes in `client/src/styles`; prefer those over one-off styling.
- Never commit secrets. `.env` files are git-ignored; add new variables to the matching `.env.example`.
- Describe what changed and why in the pull request, and include a screenshot for UI changes.

## Adding an integration

Providers are declared in `server/integrations/registry.js` (auth type, scope, actions) and surface automatically in the Integrations hub. Add the provider's actions next to the existing ones, then document any new environment variables in `server/.env.example` and the README.

## Reporting bugs and ideas

Open an issue with steps to reproduce, what you expected, and what happened. For security problems, follow [SECURITY.md](SECURITY.md) instead of filing a public issue.
