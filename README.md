# Bassir All-in-One

One portal for all your Bassir systems: every system appears as an icon on a
dashboard — click it, the system opens in a new tab, and you sign in with your
username and password there. The portal also tracks usage and shows analytics.

## Features

- **Dashboard** — all your Bassir systems as tiles with icon, name, description,
  live online/offline status and last-opened time. Clicking a tile opens the
  system's login page in a new tab.
- **Manage Systems** — add, edit or delete systems: name, URL, icon (any emoji
  or an image/logo URL), tile color and description. No code changes needed.
- **Analytics** — opens per day, opens per system, opens today / this period /
  all time, and last-opened times, filterable by 7 / 14 / 30 / 90 days.
- **Live status** — the portal pings each system's URL and shows an
  Online / Offline dot on every tile (any HTTP answer, including a login wall,
  counts as online).
- Light and dark mode follow your operating system setting automatically.

## Running it

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm start
```

Then open <http://localhost:3000>. To use a different port:
`PORT=8080 npm start`.

## First-time setup

The portal starts pre-loaded with the Bassir systems: **Stock System**,
**BOQ & Project Tracking**, and **Technical & Financial Proposal**. Go to
**Manage Systems**, set the real URL of each one, and add any other Bassir
system the same way. From then on, one click on the dashboard takes you to
that system's login page.

## For the developer: adding the system URLs

There are two ways to configure each Bassir system's address — no code
changes are required for either:

1. **Through the UI (recommended):** run the portal, open **Manage Systems**
   (`/admin.html`), click **Edit** on a system and paste its URL (must start
   with `http://` or `https://`). New systems are added on the same page —
   name, URL, an emoji or image URL as the icon, tile color and description.
2. **Before first run:** edit `seed/systems.json` and fill in each system's
   `url`. This file is only used once, to create `data/db.json` on the first
   start. If the portal has already been started, either edit through the UI
   or delete `data/db.json` and restart to re-seed.

Deployment notes:

- The server binds to the port in the `PORT` environment variable
  (default 3000) and serves everything — static frontend and API — from one
  Node.js process, so `node server.js` behind any reverse proxy is enough.
- Storage is the single file `data/db.json`; keep it on a persistent volume
  and back it up. There is no external database.
- The online/offline indicator works by the portal server fetching each
  system's URL (any HTTP response counts as online, cached for 60 seconds),
  so the machine running the portal must be able to reach the systems'
  addresses.

## Where data is stored

Everything lives in `data/db.json` (created on first run, not committed to
git): your list of systems and the click history that powers the analytics.
Back up that one file to keep your configuration. Click history is kept for
one year.

## Notes on passwords

The portal deliberately does **not** store your usernames or passwords — you
sign in on each Bassir system itself, and your browser's password manager can
remember the credentials per system. This keeps the portal simple and safe.
