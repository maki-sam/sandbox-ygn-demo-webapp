// ============================================================
//   Sandbox YGN — DevOps Foundational · Session 3.2
//   Sample Web App for Docker Containerization Lab
// ============================================================

const express = require('express');
const redis   = require('redis');
const os      = require('os');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Redis client ─────────────────────────────────────────────
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const client = redis.createClient({
  socket: { host: redisHost, port: redisPort }
});

client.on('error', (err) => console.error('[Redis] Connection error:', err));
client.connect()
  .then(() => console.log(`[Redis] Connected to ${redisHost}:${redisPort}`))
  .catch((err) => console.error('[Redis] Failed to connect:', err));

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.static('public'));

// ── Routes ───────────────────────────────────────────────────

// Health check – useful for Docker HEALTHCHECK and K8s probes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime().toFixed(2) + 's' });
});

// App info – demonstrates environment variables and container metadata
app.get('/info', (req, res) => {
  res.json({
    app: 'Sandbox YGN — DevOps Lab App',
    version: '1.0.0',
    session: 'Docker Fundamentals (3.2)',
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),               // Shows container ID inside Docker
    platform: os.platform(),
    nodeVersion: process.version,
    port: PORT,
  });
});

// Visit counter – demonstrates Redis persistence across container restarts
app.get('/counter', async (req, res) => {
  try {
    const visits = await client.incr('visit_count');
    res.json({ message: 'Visit counted!', total_visits: visits });
  } catch (err) {
    res.status(503).json({ error: 'Redis unavailable', detail: err.message });
  }
});

// Reset counter
app.delete('/counter', async (req, res) => {
  try {
    await client.set('visit_count', 0);
    res.json({ message: 'Counter reset to 0' });
  } catch (err) {
    res.status(503).json({ error: 'Redis unavailable', detail: err.message });
  }
});

// Message store – store and retrieve messages via Redis
app.post('/messages', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text field is required' });
  try {
    await client.lPush('messages', text);
    res.status(201).json({ message: 'Stored!', text });
  } catch (err) {
    res.status(503).json({ error: 'Redis unavailable', detail: err.message });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await client.lRange('messages', 0, 9); // last 10
    res.json({ count: messages.length, messages });
  } catch (err) {
    res.status(503).json({ error: 'Redis unavailable', detail: err.message });
  }
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('==============================================');
  console.log('  Sandbox YGN — DevOps Lab App');
  console.log(`  Running on port ${PORT}`);
  console.log(`  ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Container ID: ${os.hostname()}`);
  console.log('==============================================');
});