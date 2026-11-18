# 21nfinityAndBeyond · CSSP College Week

A responsive, single-page CSSP College Week experience built with plain HTML, CSS, and JavaScript. On Cloudflare Pages, the shared name wall uses a Pages Function and a Neon Postgres database. Nickname validation and the English/Filipino blocked-word filter run in both the browser and the server; the lists are practical, not exhaustive.

## Cloudflare Pages setup

The site is static files plus one Pages Function (`functions/api/names.js`). No framework or build dependencies are needed for the page itself. The build script copies only the site files into `dist/`; Cloudflare also bundles the Neon dependency for the Function.

Set these Cloudflare Pages project commands:

- **Root directory:** `/`
- **Build command:** `sh ./build-cloudflare.sh`
- **Build output directory:** `dist`
- **Deploy command, if required:** `npx wrangler pages deploy dist --project-name YOUR_PAGES_PROJECT_NAME`
- **Preview command, if required:** `npx wrangler pages dev dist --ip 0.0.0.0 --port 8788`

Replace the project-name placeholder with the Pages project you created. Do not use `npx wrangler deploy`; that command deploys a Worker, not a Pages project. Keep the `functions/` directory at the repository root.

## Connect Neon to Cloudflare Pages

1. Create a project in [Neon](https://neon.tech/). In its dashboard, copy the **pooled connection string** for the database.
2. In Neon’s **SQL Editor**, paste and run [`migrations/0001_create_explorers.sql`](migrations/0001_create_explorers.sql). It creates the `explorers` table and a case-insensitive unique index.
3. In Cloudflare Pages, open **Settings → Variables and Secrets** and add a secret named **`DATABASE_URL`**. Paste the Neon connection string as its value. Set it for both Production and Preview if you use both, then redeploy.
4. Visit `https://YOUR_SITE_DOMAIN/api/names`. A configured empty board returns `{"ok":true,"names":[]}`. Submit a name on the site and check the API or Neon’s table browser.

The website sends same-origin `GET` and `POST` requests to `/api/names`; Cloudflare Pages runs the Function and Neon stores successful submissions for all visitors. Do not put the database connection string in client-side code or commit it to Git.

### Optional local preview

Copy `.dev.vars.example` to `.dev.vars`, put your Neon connection string after `DATABASE_URL=`, then run:

```sh
sh ./build-cloudflare.sh
npx wrangler pages dev dist --ip 0.0.0.0 --port 8788
```

`.dev.vars` is git-ignored. Never share or commit the real connection string.

## Run the static page without Cloudflare

Open `index.html` or run a static server:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Without the Pages Function, names can only be cached in the current browser; shared storage requires the Cloudflare deployment and `DATABASE_URL` secret.

## Easy edits

- Letter text: `LETTER_COPY` in `app.js`
- Palette and fonts: CSS variables at the top of `styles.css`
- Logo / favicon: `assets/21nfinity-logo.png`
- Bedroom backdrop: `assets/bedroom-backdrop.jpg`
- Nickname filter: client side in `app.js` and server side in `functions/api/names.js`
