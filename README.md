# 21nfinityAndBeyond · CSSP College Week

A responsive, single-page celebration for CSSP College Week. The experience is built with plain HTML, CSS, and JavaScript: open the attic box to reveal a letter, then add one name to the shared adventure wall. On Cloudflare Pages, names are stored in Cloudflare D1 through a Pages Function (no Google Apps Script or cross-origin JSONP required).

## Run locally

Open `index.html` directly to preview the static interface, or serve the files with:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

The shared name API requires Cloudflare Pages Functions and a D1 binding. To test the full stack locally after configuring a D1 database, use `wrangler pages dev` from the repository root.

## Deploy to Cloudflare Pages

This is a static site plus a Pages Function; no framework or npm build dependencies are needed. The build script copies the web assets (and only those assets) to `dist/`.

For a Cloudflare Pages Git-connected project, set:

- **Root directory:** `/`
- **Build command:** `sh ./build-cloudflare.sh`
- **Build output directory:** `dist`

Pages handles the deployment after the build; do not use `npx wrangler deploy` (that deploys a Worker, not a Pages site). If the Cloudflare workflow requires explicit commands, use these from the repository root:

- **Deploy command:** `npx wrangler pages deploy dist --project-name YOUR_PAGES_PROJECT_NAME`
- **Preview command:** `npx wrangler pages dev dist --ip 0.0.0.0 --port 8788 --d1 DB=YOUR_D1_DATABASE_ID`

Replace each placeholder with your Pages project name and D1 database ID. The preview command binds the local Pages preview to D1; apply the schema locally first if you want the preview API to return data. The `functions/` directory must remain at the repository root so Pages can deploy the `/api/names` Function along with the static output.

## Set up Cloudflare D1

1. In the Cloudflare dashboard, create a **D1 database** (for example, `cssp-explorers`). Or from an authenticated terminal run `npx wrangler d1 create cssp-explorers`.
2. Create the table by applying the included migration. From the repository root, run:

   ```sh
   npx wrangler d1 execute cssp-explorers --remote --file=migrations/0001_create_explorers.sql
   ```

   If you chose a different database name, use that name in the command.
3. In the Pages project, open **Settings → Functions → D1 database bindings**. Add a binding with variable name **`DB`**, choose the database you created, save, and redeploy. Set the binding for both Production and Preview environments if you use both.
4. Open `https://YOUR_SITE_DOMAIN/api/names`. A configured, empty board should return JSON like `{"ok":true,"names":[]}`. Submit a name on the site and confirm it appears in the response and the D1 `explorers` table.

The Pages Function in [`functions/api/names.js`](functions/api/names.js) handles `GET /api/names` and `POST /api/names`; the schema is in [`migrations/0001_create_explorers.sql`](migrations/0001_create_explorers.sql). The frontend uses same-origin `fetch`, so it does not depend on CORS or a Google Apps Script URL. It keeps a browser-local fallback if the Pages API is temporarily unavailable; successful submissions are stored in D1 and shared across visitors.

## Easy edits

- Letter text: `LETTER_COPY` in `app.js`
- Palette and fonts: CSS variables at the top of `styles.css`
- Logo / favicon: `assets/21nfinity-logo.png`
- Bedroom backdrop: `assets/bedroom-backdrop.jpg`
- Nickname moderation: the client filter in `app.js` and server-side validation in `functions/api/names.js`
