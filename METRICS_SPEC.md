# Bassir Metrics Endpoint Specification

The portal's **Business Data** page pulls live business numbers from inside
each Bassir system: user counts and key business figures (KPIs). To connect a
system, its developer adds **one JSON endpoint** to that system, then enters
the endpoint's URL (and optional API key) in **Manage Systems**.

## The contract

- **Method:** `GET`
- **Path:** any — the full URL is configured per system in Manage Systems.
  Suggested convention: `/api/bassir-metrics`.
- **Auth (optional but recommended):** if an API key is set in Manage
  Systems, the portal sends it on every request as
  `Authorization: Bearer <key>`. The endpoint should reject requests with a
  missing or wrong key using HTTP `401`.
- **Response:** `200 OK` with `Content-Type: application/json` and this body:

```json
{
  "generatedAt": "2026-07-24T10:00:00Z",
  "users": {
    "total": 42,
    "activeToday": 7,
    "activeThisWeek": 15,
    "activeThisMonth": 22
  },
  "kpis": [
    { "key": "open_orders",  "label": "Open orders",  "value": 18,     "unit": "" },
    { "key": "stock_value",  "label": "Stock value",  "value": 125000, "unit": "SAR" },
    { "key": "low_stock",    "label": "Low-stock items", "value": 6,   "unit": "" }
  ]
}
```

### Field reference

| Field | Required | Meaning |
|---|---|---|
| `generatedAt` | no | ISO timestamp of when the numbers were computed |
| `users` | **yes** | the object must exist; individual counts may be omitted |
| `users.total` | no | all registered user accounts in the system |
| `users.activeToday` | no | distinct users who used the system today |
| `users.activeThisWeek` | no | distinct users in the last 7 days |
| `users.activeThisMonth` | no | distinct users in the last 30 days |
| `kpis` | no | up to 24 business figures, free choice per system |
| `kpis[].key` | yes* | stable machine name (`snake_case`) |
| `kpis[].label` | yes* | human label shown on the tile |
| `kpis[].value` | yes* | number (preferred) or short string |
| `kpis[].unit` | no | short unit shown after the value, e.g. `SAR`, `%` |

\* required for each KPI entry that is present.

Counts that a system cannot provide should be omitted or `null` — the portal
shows a dash for them. "Active" is typically computed from a `last_login` or
last-activity timestamp on the user table.

Each system decides its own KPIs. Examples: Stock → stock value, items below
minimum, pending transfers. BOQ & Project Tracking → active projects, overdue
tasks, contract value. Proposals → proposals in progress, submitted this
month, win rate.

## How the portal uses the endpoint

- The Business Data page fetches live numbers on view (server-side cache:
  5 minutes; the "Refresh now" button bypasses it).
- The portal also snapshots each system's numbers every 6 hours and keeps
  one snapshot per system per day (latest of the day wins, retained about
  13 months). These snapshots power the "Active users per day" history
  chart, so history starts accumulating the day the endpoint is connected.
- Timeout is 8 seconds; any non-200 response or malformed JSON is shown as
  an error state on the Business Data page, never breaking the rest of the
  portal.

## Example implementation (Express)

```js
const METRICS_KEY = process.env.BASSIR_METRICS_KEY; // same key entered in the portal

app.get('/api/bassir-metrics', async (req, res) => {
  if (METRICS_KEY && req.get('authorization') !== `Bearer ${METRICS_KEY}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const [users, kpis] = await Promise.all([getUserCounts(), getKpis()]);
  res.json({ generatedAt: new Date().toISOString(), users, kpis });
});
```

Where `getUserCounts()` runs queries such as:

```sql
SELECT COUNT(*) AS total                                           FROM users;
SELECT COUNT(DISTINCT user_id) FROM activity WHERE ts >= CURRENT_DATE;              -- activeToday
SELECT COUNT(DISTINCT user_id) FROM activity WHERE ts >= NOW() - INTERVAL '7 days'; -- activeThisWeek
SELECT COUNT(DISTINCT user_id) FROM activity WHERE ts >= NOW() - INTERVAL '30 days';-- activeThisMonth
```

## Testing without touching a real system

`examples/mock-metrics-server.js` in this repository serves a valid sample
response:

```bash
node examples/mock-metrics-server.js 4001
```

Then set a system's Metrics URL to `http://localhost:4001/api/bassir-metrics`
in Manage Systems and open the Business Data page.
