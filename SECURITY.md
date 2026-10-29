# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private
"Report a vulnerability" option on the repository's **Security** tab, or email the
maintainers at the address listed on the repository profile.

Include what you found, steps to reproduce, and the impact you expect. We aim to
acknowledge reports within 3 business days and to ship a fix or mitigation for
confirmed issues as quickly as we can.

## Supported versions

Only the latest release on `main` receives security fixes.

## Running PlanCrest securely

- Set strong, unique values for `JWT_SECRET` and `ENCRYPTION_KEY`, and never reuse them across environments.
- Serve the app over HTTPS and set `CLIENT_URL` / `API_PUBLIC_URL` to the real origins; CORS and CSRF protection rely on them.
- Keep `.env` files out of version control and rotate any key that has been shared or committed.
- Integration tokens are encrypted at rest with `ENCRYPTION_KEY`; changing that key requires reconnecting integrations.
