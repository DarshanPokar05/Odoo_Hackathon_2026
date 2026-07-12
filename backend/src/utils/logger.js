const { query } = require('../config/db');

/**
 * Reusable activity logging helper required by Phase 5 spec.
 * Logs state-changing actions across modules.
 */
async function logActivity({ userId, action, entityType, entityId, details = {} }, dbClient = null) {
  const sql = `
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES ($1, $2, $3, $4, $5::jsonb)
  `;
  const params = [userId || null, action, entityType, entityId || null, JSON.stringify(details)];

  if (dbClient) {
    return dbClient.query(sql, params);
  }
  return query(sql, params);
}

module.exports = { logActivity };
