const { query } = require('../../config/db');

async function listMyNotifications(userId) {
  const res = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return res.rows;
}

async function markAsRead(notificationId, userId) {
  const res = await query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return res.rows[0];
}

async function markAllAsRead(userId) {
  await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [userId]);
  return { success: true };
}

module.exports = { listMyNotifications, markAsRead, markAllAsRead };
