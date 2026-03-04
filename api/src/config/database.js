import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isNeon = process.env.DATABASE_URL?.includes('neon.tech');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: isNeon ? 0 : parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  idleTimeoutMillis: isNeon ? 10000 : 30000,
  connectionTimeoutMillis: isNeon ? 30000 : 10000,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
  allowExitOnIdle: isNeon,
});

pool.on('error', (err) => {
  console.warn('Idle database client error (will reconnect):', err.message);
});

const TRANSIENT_ERROR_CODES = new Set([
  'CONNECTION_TERMINATED',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  '57P01', // admin_shutdown
  '57P03', // cannot_connect_now
]);

function isTransient(err) {
  if (!err) return false;
  const msg = err.message || '';
  if (msg.includes('Connection terminated') || msg.includes('connection timeout')) return true;
  return TRANSIENT_ERROR_CODES.has(err.code);
}

/**
 * Query wrapper with automatic retry for transient Neon connection failures.
 * Delegates to pool.query but retries once on cold-start / stale-connection errors.
 */
async function queryWithRetry(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (isTransient(err)) {
      console.warn('Transient DB error, retrying once:', err.message);
      return await pool.query(text, params);
    }
    throw err;
  }
}

// Proxy that exposes the same interface as pool but uses retry-aware query
const db = {
  query: queryWithRetry,
  connect: () => pool.connect(),
  on: (...args) => pool.on(...args),
  end: () => pool.end(),
  get totalCount() { return pool.totalCount; },
  get idleCount() { return pool.idleCount; },
  get waitingCount() { return pool.waitingCount; },
};

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(-1);
  }
  console.log('Database connected successfully at:', res.rows[0].now);
});

export default db;
