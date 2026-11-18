# 21nfinityAndBeyond · CSSP College Week

A responsive, single-page celebration for CSSP College Week. The experience is built with plain HTML, CSS, and JavaScript: open the attic box to reveal a letter, then add a name to the adventure wall.

## Run locally

Open `index.html` directly, or run a static server from this folder:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Names are stored in this browser using `localStorage` until a shared Google Sheet is configured.

## Deploy to Cloudflare Pages

This is a static HTML/CSS/JavaScript site; it does not need a framework, package install, or server runtime. `build-cloudflare.sh` copies just the site and its required images into `dist/`.

For a Cloudflare Pages project connected to this Git repository, use:

- **Build command:** `sh ./build-cloudflare.sh`
- **Build output directory:** `dist`
- **Root directory:** `/` (the repository root)

Do not set a custom deploy command for a Pages Git deployment; Pages handles publishing after the build. In particular, `npx wrangler deploy` is the Worker deploy command, not the Pages command, and is what caused Wrangler to look for a Worker static-assets configuration and fail. For a manual Wrangler upload instead, first build the files and then run `npx wrangler pages deploy dist --project-name YOUR_PAGES_PROJECT_NAME` (replace the placeholder with the Pages project name you created).

## Connect a Google Sheet

1. Create a Google Sheet and open **Extensions → Apps Script**.
2. Paste the contents of [`apps-script/Code.gs`](apps-script/Code.gs) into the editor. The script creates an `Explorers` tab and headings the first time it runs. `SPREADSHEET_ID` is configured for the Sheet you provided; change it if you switch to another spreadsheet.
3. Select **Deploy → New deployment → Web app**. Set **Execute as** to *Me* and access to *Anyone*, then deploy and authorize it. (Anyone with the URL can submit a name; use only for a public event board.)
4. Copy the deployed Web app URL into `GOOGLE_APPS_SCRIPT_URL` near the top of `app.js`.
5. Reload the site. The Apps Script endpoint reads and appends names in the spreadsheet; if the endpoint is temporarily unavailable, the page keeps the visitor's locally cached names.
6. Test the endpoint by opening its URL with `?action=list` appended; it should return JSON with `ok: true` and a `names` array. Then test a sample name from the site and confirm it appears in the `Explorers` tab.

The endpoint uses JSONP to work from a static site without a separate server or CORS setup. Names are validated on both the page and Apps Script side, including one explorer per submission and a common English/Filipino profanity filter. If you change `Code.gs` later, open **Deploy → Manage deployments**, edit the web app, choose **New version**, and deploy again. For a public deployment, anyone with the endpoint URL can submit a name, so use it only for a public event board and consider moderation/quotas.

## Easy edits

- Letter text: `LETTER_COPY` in `app.js`
- Palette and fonts: CSS variables at the top of `styles.css`
- Google Sheets connection: `GOOGLE_APPS_SCRIPT_URL` in `app.js`
- Logo / favicon: `assets/21nfinity-logo.png` (the supplied transparent logo)
- Bedroom backdrop: `assets/bedroom-backdrop.jpg` (original generated room scene)
- Nickname moderation terms: `PROFANITY` in `app.js` and `BLOCKED_WORDS` in `apps-script/Code.gs`
