# Portfolio

Public portfolio and blog (Astro), admin panel (React + shadcn/ui), API (Cloudflare Workers + Hono + D1).

```
packages/web    Astro site, pre-rendered, published to GitHub Pages
packages/admin  Vite + React admin panel, served at /admin/
packages/api    Cloudflare Worker: content API, uploads, visit tracking, morse login
seed/           Content from the previous portfolio (also generates packages/api/seed.sql)
```

Requirements: Node 22+, pnpm 9 (`npm i -g pnpm`), a GitHub account, a free Cloudflare account.

---

## 1. Test locally

### A. Public site only (no backend, 2 minutes)

```bash
pnpm install
pnpm dev:web          # http://localhost:4321
```

It uses the content in `seed/data.mjs`. On the first run it downloads your old images from
`tanvir-005.github.io/Portfolio` into the build, so you need internet once.
Check:

- Home: hero, **contest record board** (17 tiles, colour = rank band), projects, education/leadership, skills, certificates, contact.
- Click a tile or project: detail page with the facts panel on the right.
- `/contests/` (board plus table), `/projects/`, `/blog/`, `/blog/welcome-to-the-new-portfolio/` (code copy button).
- Ctrl K (or "Menu" on a phone): jump to any page. Theme toggle in the header. Resize to phone width.
- Production check: `pnpm --filter web build && pnpm --filter web preview`, then open `/sitemap-index.xml`, `/robots.txt`, `/rss.xml`, and view-source on any page to confirm the HTML, meta tags and JSON-LD are there.

### B. Full stack (site + admin + API)

Terminal 1, the API:

```bash
cd packages/api
cp .dev.vars.example .dev.vars        # edit JWT_SECRET and VISITOR_SALT to any long random strings
pnpm db:migrate:local
pnpm db:seed:local                    # seed.sql is included; regenerate it with `pnpm seed:sql` at the repo root after editing seed/data.mjs
pnpm dev                              # http://localhost:8787
```

Terminal 2, the admin:

```bash
VITE_API_URL=http://localhost:8787 pnpm dev:admin     # http://localhost:5173/admin/
```

Terminal 3, the public site reading from the API:

```bash
PUBLIC_API_URL=http://localhost:8787 pnpm dev:web
```

Check:

1. Open the admin. Hold the key (400 ms or more) for a dash, tap for a dot, then dash again: `-.-`.
   The box above the key shows each symbol. After 2 seconds of silence it submits.
   You should see a warning to change the starting sequence.
2. Wrong sequences are rejected; five wrong ones lock it for 15 minutes (the server stores this, so restart does not reset it).
3. Posts: create a post, insert an image, set tags, save. Contests: reorder with the arrows. Profile: upload a PDF as the CV.
4. Restart `pnpm dev:web` (it re-fetches content). Your changes should appear.
5. Visits: tracking is deliberately off on localhost. To test it, send one by hand:
   ```bash
   curl -X POST http://localhost:8787/api/track -H "User-Agent: Mozilla/5.0" -d '{"path":"/blog/"}'
   ```
   (The Worker ignores requests whose Origin is not allowed; curl sends none, so this counts.) Then open Visits in the admin.

Troubleshooting: if `pnpm install` or a build prints a type error, send me the message. If images do not download, you are offline or the old site moved.

---

## 2. Deploy

Order matters: GitHub repo, Cloudflare API, then connect them.

### Step 1. GitHub repository

1. Create a **public** repo named exactly `tanvir-005.github.io` (this makes the site live at `https://tanvir-005.github.io/`).
2. Push the project to the `main` branch:
   ```bash
   git init && git add . && git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/tanvir-005/tanvir-005.github.io.git
   git push -u origin main
   ```
3. Repo > Settings > Pages > **Source: GitHub Actions**.
4. Your old repo `Portfolio` can stay; once the new site works, archive it or add a redirect.

The first workflow run will fail until Step 3 is done. That is expected.

### Step 2. Cloudflare API

```bash
cd packages/api
npx wrangler login
npx wrangler d1 create portfolio
```

Copy the printed `database_id` into `packages/api/wrangler.toml` (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`). Then:

```bash
pnpm db:migrate                       # creates the tables
pnpm db:seed                          # loads your content (seed.sql is already generated)
npx wrangler secret put JWT_SECRET    # paste a long random string
npx wrangler secret put VISITOR_SALT  # paste another long random string
npx wrangler secret put GITHUB_TOKEN  # see below
pnpm run deploy
```

`pnpm run deploy` prints your API address, like `https://portfolio-api.<your-subdomain>.workers.dev`. Open `<that>/api/health`; you should see `{"ok":true}`.

Create the GitHub token for `GITHUB_TOKEN`: GitHub > Settings > Developer settings > Personal access tokens > **Fine-grained tokens** > Generate. Repository access: only `tanvir-005.github.io`. Permission: **Contents: Read and write**. (The Worker uses it only to ask GitHub to rebuild the site.)

If your GitHub username or repo name differs, edit `GITHUB_REPO` and `ALLOWED_ORIGINS` in `wrangler.toml` and `site` in `packages/web/astro.config.mjs`.

### Step 3. Connect and publish

1. Repo > Settings > Secrets and variables > Actions > **Variables** > New repository variable: name `API_URL`, value = your Worker address (no trailing slash).
2. Repo > Actions > "Deploy site" > **Run workflow** (or push any commit).
3. When it is green, open `https://tanvir-005.github.io/` and `https://tanvir-005.github.io/admin/`.

### Step 4. First login and cleanup

1. In the admin, enter dash, dot, dash. Go to **Settings > Change sequence** and set a longer one (8 or more symbols). A 3-symbol sequence has only 8 combinations.
2. Upload your current CV in **Profile and CV**, replace the portrait if you like, then press **Publish site**. The site rebuilds in about a minute.
3. Replace the sample post, then write real ones.

### Step 5. Search engines

1. Google Search Console > Add property > URL prefix `https://tanvir-005.github.io/` and verify (HTML tag method: put the tag in `packages/web/src/layouts/Base.astro`, push).
2. Submit `https://tanvir-005.github.io/sitemap-index.xml`.
3. Test a page with Google's Rich Results Test to confirm the structured data.

### Daily use

Edit in the admin, press **Publish site**. The Worker triggers the GitHub Action, which rebuilds the static pages. The workflow also runs every Monday so the Codeforces rating stays fresh.

---

## Notes

- Tap = dot (press shorter than 300 ms), hold = dash. Timings are adjustable in Settings.
- The admin is public at `/admin/` but shows only the key. It is marked `noindex` and is not listed in robots.txt.
- Visits are counted without cookies, bots are filtered, and localhost is never counted.
- Uploads (PNG, JPG, WebP, GIF, AVIF, PDF, up to 8 MB) are committed by the API to `packages/web/public/uploads` in your GitHub repo, so no card or file-storage service is needed. Each upload triggers a rebuild. Pull before you push if you edit the repo by hand.
- If your repo or branch differs from `tanvir-005/tanvir-005.github.io` on `main`, set `VITE_RAW_BASE` for the admin build (see `packages/admin/src/lib/api.ts`).
