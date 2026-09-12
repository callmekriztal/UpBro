const { Queue } = require('bullmq');
const redisOptions = require('../config/redis');

// Shared BullMQ queue instance for monitoring ping jobs
const pingQueue = new Queue('ping-checks-queue', {
  connection: redisOptions
});

module.exports = pingQueue;
