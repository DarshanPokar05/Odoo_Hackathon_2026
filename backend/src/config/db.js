const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.SUPABASE_DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function checkHealth() {
  try {
    const res = await pool.query('SELECT NOW() AS now');
    return {
      status: 'ok',
      db: 'connected',
      time: res.rows[0].now,
    };
  } catch (err) {
    return {
      status: 'degraded',
      db: 'disconnected',
      error: err.message,
    };
  }
}

async function getClient() {
  return pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
  checkHealth,
};
