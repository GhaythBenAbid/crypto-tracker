const Redis = require('ioredis');

const redis = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3) {
            console.error('Could not connect to Redis. Please ensure Redis is running.');
            return null;
        }
        return Math.min(times * 200, 1000);
    }
});

redis.on('connect', () => {
    console.log('Successfully connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});