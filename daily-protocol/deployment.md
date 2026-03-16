# Deployment Options

## Recommended: GitHub Pages

**What it is:** Free static site hosting from GitHub. Your built app files live in a repo and GitHub serves them at `https://dvdroney.github.io/daily-protocol`.

**Pros:**
- Free forever, no usage limits for static sites
- HTTPS included (required for PWA install + service workers)
- Permanent URL that won't change
- PWA "Add to Home Screen" works perfectly
- Deploys with a single `git push` — no extra tools
- You already have a GitHub account (`dvdroney`)

**Cons:**
- Site is public (but all data stays in your phone's IndexedDB — the hosted code contains no personal data, just the checklist structure)
- Requires re-authenticating `gh` CLI (token expired)

**How to deploy:**
```bash
# 1. Re-authenticate GitHub CLI
gh auth login

# 2. Create the repo
gh repo create daily-protocol --public --source=. --push

# 3. Add base path for GitHub Pages subdirectory
#    (I'll update vite.config.js to set base: '/daily-protocol/')

# 4. Build and deploy
npm run build
npx gh-pages -d dist

# 5. Enable Pages in repo settings (or gh-pages branch auto-enables it)
#    Your app will be at: https://dvdroney.github.io/daily-protocol
```

After initial setup, redeploying is just:
```bash
npm run build && npx gh-pages -d dist
```

---

## Alternatives Considered

### Netlify
**What:** Free static hosting with CI/CD.
**Pros:** Generous free tier, automatic HTTPS, deploy previews.
**Cons:** Requires creating a Netlify account and authenticating the CLI. More moving parts than GitHub Pages for a simple static app.
**Verdict:** Good option, but adds another account when GitHub already works.

### Cloudflare Pages
**What:** Free static hosting from Cloudflare.
**Pros:** Fast global CDN, unlimited bandwidth, automatic HTTPS.
**Cons:** Requires Cloudflare account. We tried Cloudflare Tunnels (the quick-access version) from WSL2 and they were unreliable — QUIC protocol issues behind the WSL2 virtual network.
**Verdict:** Would work for permanent hosting but needs account setup.

### Vercel
**What:** Free hosting optimized for frontend frameworks.
**Pros:** Great DX, automatic deploys from git, preview URLs.
**Cons:** Requires account. Overkill for a pure static PWA with no backend.
**Verdict:** Designed for Next.js/SSR apps — unnecessary complexity here.

### Local network (WSL2 port forwarding)
**What:** Serve the app from your PC, access on phone via local Wi-Fi.
**Pros:** Fully private, no external hosting.
**Cons:** Requires running PowerShell as Admin to set up port forwarding (`netsh interface portproxy`), plus a Windows firewall rule. Only works when your PC is on. WSL2 uses a virtual network that isn't directly reachable from other devices — this is a known WSL2 pain point.
**Verdict:** Too fragile for daily use. App should be available even when your PC is off.

### Tunnels (localtunnel, ngrok, cloudflared)
**What:** Temporary public URLs that forward to your local dev server.
**Pros:** Quick for testing.
**Cons:** All three failed from WSL2 — localtunnel required a password (your public IP), cloudflared had QUIC/connection issues, ngrok now requires account + auth token. URLs are temporary and change every restart.
**Verdict:** Not suitable for a daily-use app.

---

## Why GitHub Pages

1. **You already have the account** — just need to refresh the auth token
2. **Zero cost, zero maintenance** — no servers, no expiring tunnels
3. **Permanent HTTPS URL** — PWA install works, service worker caches everything
4. **Your data never leaves your phone** — the hosted site is just code, all checklist data lives in your phone's IndexedDB
5. **One-command redeploys** when you want to update the app
