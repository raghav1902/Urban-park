const redis = require('redis');

class MemoryLockStore {
  constructor() {
    this.store = new Map();
    this.timeouts = new Map();
  }

  async set(key, value, options = {}) {
    if (options.NX && this.store.has(key)) {
      return null; // Already exists
    }

    this.store.set(key, {
      value,
      expiresAt: options.EX ? Date.now() + options.EX * 1000 : null,
      exSeconds: options.EX || 0
    });

    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    if (options.EX) {
      const timeout = setTimeout(() => {
        this.store.delete(key);
        this.timeouts.delete(key);
      }, options.EX * 1000);
      this.timeouts.set(key, timeout);
    }

    return 'OK';
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const remainingMs = item.expiresAt - Date.now();
    if (remainingMs <= 0) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil(remainingMs / 1000);
  }

  async del(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }
}

const memoryStore = new MemoryLockStore();
let isRedisConnected = false;

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        return false; // Stop retrying quickly to avoid log spam
      }
      return 1000;
    }
  }
});

client.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ Redis Connected');
});

client.on('error', (err) => {
  if (isRedisConnected) {
    console.error('❌ Redis Error:', err.message);
  }
  isRedisConnected = false;
});

// Attempt connection gracefully
(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.log('ℹ️ Redis server not reachable, utilizing resilient in-memory lock store fallback.');
  }
})();

// Proxy client methods to use Redis when connected or memoryStore as fallback
const resilientClient = {
  async set(key, value, options) {
    if (isRedisConnected) {
      try {
        return await client.set(key, value, options);
      } catch (err) {
        console.warn('Redis SET error, falling back to memory store:', err.message);
      }
    }
    return await memoryStore.set(key, value, options);
  },

  async get(key) {
    if (isRedisConnected) {
      try {
        return await client.get(key);
      } catch (err) {
        console.warn('Redis GET error, falling back to memory store:', err.message);
      }
    }
    return await memoryStore.get(key);
  },

  async ttl(key) {
    if (isRedisConnected) {
      try {
        return await client.ttl(key);
      } catch (err) {
        console.warn('Redis TTL error, falling back to memory store:', err.message);
      }
    }
    return await memoryStore.ttl(key);
  },

  async del(key) {
    if (isRedisConnected) {
      try {
        return await client.del(key);
      } catch (err) {
        console.warn('Redis DEL error, falling back to memory store:', err.message);
      }
    }
    return await memoryStore.del(key);
  },

  isAvailable() {
    return isRedisConnected;
  }
};

module.exports = resilientClient;
