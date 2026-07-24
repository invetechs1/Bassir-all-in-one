// Minimal mock of a Bassir system's metrics endpoint (see METRICS_SPEC.md).
// Usage: node examples/mock-metrics-server.js [port] [apiKey]
const http = require('http');

const port = Number(process.argv[2]) || 4001;
const apiKey = process.argv[3] || '';

const server = http.createServer((req, res) => {
  if (req.url !== '/api/bassir-metrics') {
    res.writeHead(404).end();
    return;
  }
  if (apiKey && req.headers.authorization !== `Bearer ${apiKey}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    generatedAt: new Date().toISOString(),
    users: {
      total: 42,
      activeToday: 5 + Math.floor(Math.random() * 6),
      activeThisWeek: 18,
      activeThisMonth: 27
    },
    kpis: [
      { key: 'open_orders', label: 'Open orders', value: 18, unit: '' },
      { key: 'stock_value', label: 'Stock value', value: 125000, unit: 'SAR' },
      { key: 'low_stock', label: 'Low-stock items', value: 6, unit: '' }
    ]
  }));
});

server.listen(port, () => {
  console.log(`Mock Bassir metrics endpoint: http://localhost:${port}/api/bassir-metrics${apiKey ? ' (key required)' : ''}`);
});
