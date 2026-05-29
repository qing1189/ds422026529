import { config } from 'dotenv';
config();

import express from 'express';
import { initTokenPool, getPoolInfo, getTotalCapacity, addTokenToPool, loginAndAddToken, getAliveTokens, startHealthCheck } from './auth.js';
import { prewarmSessions, getSessionInfo } from './session.js';
import { handleOpenAICompletion, handleOpenAIModels } from './openai.js';
import { handleDeepSeekCompletion } from './deepseek.js';
import { getQueueInfo } from './queue.js';
import { requestLogger, getRecentLogs, getLogStats } from './logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const startTime = Date.now();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Request logging
app.use(requestLogger);

// API Key auth middleware
app.use((req, res, next) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next();
  if (req.method === 'GET' && req.path === '/admin') return next();

  const auth = req.headers['authorization'];
  if (auth === `Bearer ${apiKey}`) return next();

  res.status(401).json({ error: { message: 'Invalid API key' } });
});

// OpenAI format
app.post('/v1/chat/completions', handleOpenAICompletion);
app.get('/v1/models', handleOpenAIModels);

// DeepSeek native format
app.post('/api/v0/chat/completion', handleDeepSeekCompletion);

// Health check + pool info
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    pool: getPoolInfo(),
    totalCapacity: getTotalCapacity(),
    queue: getQueueInfo(),
  });
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/api/stats', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptimeSeconds,
    pool: getPoolInfo(),
    totalCapacity: getTotalCapacity(),
    queue: getQueueInfo(),
    sessions: getSessionInfo(),
    logStats: getLogStats(),
  });
});

app.get('/admin/api/logs', (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 50, 200);
  res.json({ logs: getRecentLogs(count), stats: getLogStats() });
});

app.post('/admin/api/token/add', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: { message: 'token required' } });
  }
  try {
    const added = await addTokenToPool(token);
    res.json({ success: true, visionCapable: added.visionCapable });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.post('/admin/api/token/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { message: 'email and password required' } });
  }
  try {
    const token = await loginAndAddToken(email, password);
    res.json({ success: true, token: token.slice(0, 12) + '...' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.listen(PORT, async () => {
  console.log(`DeepSeek 2API running on http://localhost:${PORT}`);
  console.log(`OpenAI format:  POST /v1/chat/completions`);
  console.log(`DeepSeek format: POST /api/v0/chat/completion`);
  console.log(`Models: GET /v1/models`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);

  await initTokenPool();

  const aliveTokens = getAliveTokens();
  await prewarmSessions(aliveTokens);

  startHealthCheck();
});
