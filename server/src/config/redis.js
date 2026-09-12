/**
 * Redis Connection Configuration for BullMQ
 */
const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null // Required by BullMQ for blocking operations
};

module.exports = redisOptions;
