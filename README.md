# 21nfinityAndBeyond · CSSP College Week

A responsive, single-page celebration for CSSP College Week. The experience is built with plain HTML, CSS, and JavaScript: open the attic box to reveal a letter, then add a name to the adventure wall.

## Run locally

Open `index.html` directly, or run a static server from this folder:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Names are stored in this browser using `localStorage` until a shared Google Sheet is configured.

## Connect a Google Sheet

1. Create a Google Sheet and open **Extensions → Apps Script**.
2. Paste the contents of [`apps-script/Code.gs`](apps-script/Code.gs) into the editor. The script creates an `Explorers` tab and headings the first time it runs.
3. Select **Deploy → New deployment → Web app**. Set **Execute as** to *Me* and access to *Anyone*, then deploy and authorize it. (Anyone with the URL can submit a name; use only for a public event board.)
4. Copy the deployed Web app URL into `GOOGLE_APPS_SCRIPT_URL` near the top of `app.js`.
5. Reload the site. The Apps Script endpoint reads and appends names in the spreadsheet; if the endpoint is temporarily unavailable, the page keeps the visitor's locally cached names.

The endpoint uses JSONP to work from a static site without a separate server or CORS setup. Names are validated on both the page and Apps Script side. For a public deployment, share the deployed endpoint only with the intended site and consider adding quotas or moderation if needed.

## Easy edits

- Letter text: `LETTER_COPY` in `app.js`
- Palette and fonts: CSS variables at the top of `styles.css`
- Google Sheets connection: `GOOGLE_APPS_SCRIPT_URL` in `app.js`
- Logo / favicon: `assets/21nfinity-logo.png` (the supplied transparent logo)
- Bedroom backdrop: `assets/bedroom-backdrop.jpg` (original generated room scene)
- Nickname moderation terms: `PROFANITY` in `app.js` and `BLOCKED_WORDS` in `apps-script/Code.gs`
