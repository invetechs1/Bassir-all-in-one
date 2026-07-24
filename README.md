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

The portal starts with four example systems. Go to **Manage Systems**, edit
each one (or delete them and add your own) and set the real URL of every
Bassir system. From then on, one click on the dashboard takes you to that
system's login page.

## Where data is stored

Everything lives in `data/db.json` (created on first run, not committed to
git): your list of systems and the click history that powers the analytics.
Back up that one file to keep your configuration. Click history is kept for
one year.

## Notes on passwords

The portal deliberately does **not** store your usernames or passwords — you
sign in on each Bassir system itself, and your browser's password manager can
remember the credentials per system. This keeps the portal simple and safe.
