const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return retries * 100;
    },
  },
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('✓ Redis Client Connected'));
client.on('ready', () => console.log('✓ Redis Client Ready'));
client.on('reconnecting', () => console.log('⟳ Redis Client Reconnecting...'));

let isConnected = false;

async function connect() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
}

// Session management
async function setSession(sessionId, data, expirySeconds = 86400) {
  await client.setEx(`session:${sessionId}`, expirySeconds, JSON.stringify(data));
}

async function getSession(sessionId) {
  const data = await client.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function deleteSession(sessionId) {
  await client.del(`session:${sessionId}`);
}

async function extendSession(sessionId, expirySeconds = 86400) {
  await client.expire(`session:${sessionId}`, expirySeconds);
}

// Rate limiting
async function checkRateLimit(key, limit, windowSeconds) {
  const current = await client.incr(key);
  
  if (current === 1) {
    await client.expire(key, windowSeconds);
  }
  
  const ttl = await client.ttl(key);
  
  return {
    allowed: current <= limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetIn: ttl
  };
}

async function resetRateLimit(key) {
  await client.del(key);
}

// Caching
async function setCache(key, value, expirySeconds = 3600) {
  await client.setEx(`cache:${key}`, expirySeconds, JSON.stringify(value));
}

async function getCache(key) {
  const data = await client.get(`cache:${key}`);
  return data ? JSON.parse(data) : null;
}

async function deleteCache(key) {
  await client.del(`cache:${key}`);
}

async function deleteCachePattern(pattern) {
  const keys = await client.keys(`cache:${pattern}`);
  if (keys.length > 0) {
    await client.del(keys);
  }
  return keys.length;
}

// Health check
async function healthCheck() {
  try {
    const pong = await client.ping();
    return { healthy: pong === 'PONG', message: pong };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

// Graceful shutdown
async function disconnect() {
  if (isConnected) {
    await client.quit();
    isConnected = false;
    console.log('✓ Redis Client Disconnected');
  }
}

module.exports = {
  connect,
  disconnect,
  setSession,
  getSession,
  deleteSession,
  extendSession,
  checkRateLimit,
  resetRateLimit,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  healthCheck,
  client,
};
