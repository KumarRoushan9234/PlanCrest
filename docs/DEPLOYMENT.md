# Deploying PlanCrest

## Option 1: Docker Compose (single server)

```bash
cp server/.env.example server/.env    # fill it in, see below
docker compose up --build -d
```

This runs MongoDB, the API on port 8000 and the web app (nginx) on port 8080. Put a reverse proxy with HTTPS (Caddy, nginx, Traefik) in front of both. If the app and API use different public URLs, rebuild the web image with the right API address:

```bash
docker compose build --build-arg VITE_API_URL=https://api.example.com/api web
```

## Option 2: Managed hosting

- **API**: any Node 20+ host (Render, Railway, Fly.io, a VM). Start command `node server.js`, root `server/`.
- **Web**: any static host (Vercel, Netlify, Cloudflare Pages). Build `npm run build` in `client/`, publish `client/dist`, and add a rewrite of all paths to `/index.html`.
- **Database**: MongoDB Atlas or your own MongoDB 6+.

## Production environment

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` (turns on secure, cross site cookies and hides error details) |
| `DATABASE` | Your production connection string |
| `JWT_SECRET`, `ENCRYPTION_KEY` | Two different values from `openssl rand -hex 32`. Never reuse development values. |
| `CLIENT_URL` | The exact public URL of the web app, e.g. `https://app.example.com` |
| `API_PUBLIC_URL` | The exact public URL of the API, e.g. `https://api.example.com` |
| `EMAIL_*` | A real mailbox or SMTP service; without it users cannot verify their email |
| `CLOUDINARY_*` | Needed for uploads |
| `OPENROUTER_*`, `GOOGLE_*`, `GITHUB_*`, `SLACK_*` | Only for the features you enable |

Client build variable: `VITE_API_URL=https://api.example.com/api`.

The API sets `trust proxy` to 1, so run it behind exactly one reverse proxy, or adjust that setting, for rate limiting to see real client IPs.

## OAuth callback URLs

Register these in each provider's developer console:

- Google: `https://api.example.com/api/integrations/google/callback`
- GitHub: `https://api.example.com/api/integrations/github/callback`
- Slack: `https://api.example.com/api/integrations/slack/callback`

For Google sign in, add your web app domain to the Firebase project's authorized domains.

## Go live checklist

- [ ] `NODE_ENV=production`, HTTPS on both the app and the API
- [ ] Fresh `JWT_SECRET` and `ENCRYPTION_KEY`, stored only in your host's secret settings
- [ ] Database user limited to the PlanCrest database, IP access list or private networking enabled, backups turned on
- [ ] Email sending verified (register a test account and receive the code)
- [ ] OAuth callback URLs registered for every enabled integration
- [ ] `GET /api/health` wired to your host's health check
- [ ] Logs collected somewhere you can search
- [ ] Privacy and Terms pages reviewed for your organisation
