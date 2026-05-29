// Request logger middleware — structured log for every API request
// Usage: import { requestLogger, getRecentLogs } from './logger.js'; app.use(requestLogger);

const MAX_LOGS = 1000;
const recentLogs = [];

export function requestLogger(req, res, next) {
  const start = Date.now();
  const model = req.body?.model || '-';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const entry = {
      time: new Date().toISOString(),
      method: req.method,
      path: req.path,
      model,
      status: res.statusCode,
      duration,
    };

    console.log(`[${entry.time}] ${entry.method} ${entry.path} model=${entry.model} ${entry.status} ${entry.duration}ms`);

    if (recentLogs.length >= MAX_LOGS) recentLogs.shift();
    recentLogs.push(entry);
  });

  next();
}

export function getRecentLogs(count = 50) {
  return recentLogs.slice(-count);
}

export function getLogStats() {
  const now = Date.now();
  const last5min = recentLogs.filter(e => now - new Date(e.time).getTime() < 300000);
  const errors = last5min.filter(e => e.status >= 400);
  const avgDuration = last5min.length
    ? Math.round(last5min.reduce((s, e) => s + e.duration, 0) / last5min.length)
    : 0;
  return {
    totalRequests: recentLogs.length,
    last5min: last5min.length,
    errors5min: errors.length,
    avgDuration5min: avgDuration,
  };
}
