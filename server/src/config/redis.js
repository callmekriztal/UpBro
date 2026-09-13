/**
 * Redis Connection Configuration for BullMQ & Health Checks
 * Supports REDIS_URL connection string (Render / Upstash / Redis Cloud) or host/port
 */
let redisOptions;

if (process.env.REDIS_URL) {
  try {
    const url = new URL(process.env.REDIS_URL);
    redisOptions = {
      host: url.hostname,
      port: Number(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    };
  } catch (e) {
    redisOptions = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    };
  }
} else {
  redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  };
}

module.exports = redisOptions;
