const { query } = require('../../config/db');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');

class BookingOverlapError extends Error {
  constructor(message, conflictingBooking) {
    super(message);
    this.name = 'BookingOverlapError';
    this.code = 'BOOKING_OVERLAP';
    this.status = 409;
    this.conflictingBooking = conflictingBooking;
  }
}

async function createBooking(payload, user) {
  const { resourceAssetId, startTime, endTime, purpose } = payload;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new BadRequestError('End time must be after start time.');
  }

  // 1. Check asset validity & bookable status
  const assetRes = await query(`SELECT id, asset_tag, name, is_bookable, status FROM assets WHERE id = $1`, [
    resourceAssetId,
  ]);
  if (assetRes.rows.length === 0) {
    throw new NotFoundError('Asset not found');
  }
  const asset = assetRes.rows[0];

  if (!asset.is_bookable) {
    throw new BadRequestError(`Asset ${asset.asset_tag} is not marked as resource-bookable.`);
  }

  if (['Lost', 'Retired', 'Disposed'].includes(asset.status)) {
    throw new BadRequestError(`Cannot book asset ${asset.asset_tag} in terminal state '${asset.status}'.`);
  }

  // 2. Application-level overlap pre-check (Hard Constraint 4)
  // Two bookings overlap if existing.start < new.end AND existing.end > new.start
  const overlapRes = await query(
    `SELECT b.id, b.start_time, b.end_time, b.purpose, b.booked_by, u.name AS booked_by_name, u.email AS booked_by_email
     FROM bookings b
     LEFT JOIN users u ON b.booked_by = u.id
     WHERE b.resource_asset_id = $1
       AND b.status <> 'Cancelled'
       AND b.start_time < $2
       AND b.end_time > $3
     LIMIT 1`,
    [resourceAssetId, end.toISOString(), start.toISOString()]
  );

  if (overlapRes.rows.length > 0) {
    const conflict = overlapRes.rows[0];
    throw new BookingOverlapError(
      `Booking request overlaps with existing booking by ${conflict.booked_by_name || 'another user'}.`,
      {
        id: conflict.id,
        bookedBy: conflict.booked_by,
        bookedByName: conflict.booked_by_name,
        startTime: conflict.start_time,
        endTime: conflict.end_time,
        purpose: conflict.purpose,
      }
    );
  }

  // 3. Attempt DB Insert with try/catch for EXCLUDE constraint (DB layer enforcement)
  try {
    const insertRes = await query(
      `INSERT INTO bookings (resource_asset_id, booked_by, start_time, end_time, status, purpose)
       VALUES ($1, $2, $3, $4, 'Upcoming', $5)
       RETURNING *`,
      [resourceAssetId, user.id, start.toISOString(), end.toISOString(), purpose || null]
    );

    const booking = insertRes.rows[0];

    // Also record reminder notification
    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'BOOKING_CREATED', $2, $3)`,
      [
        user.id,
        `Booking confirmed: ${asset.asset_tag}`,
        `You booked ${asset.name} (${asset.asset_tag}) from ${start.toLocaleString()} to ${end.toLocaleString()}.`,
      ]
    );

    return formatBookingRow({
      ...booking,
      asset_tag: asset.asset_tag,
      resource_asset_name: asset.name,
      booked_by_name: user.name,
      booked_by_email: user.email,
    });
  } catch (err) {
    if (err.code === '23P01') {
      // Postgres exclusion constraint violation fallback
      throw new BookingOverlapError('Booking overlaps with existing booking.', null);
    }
    throw err;
  }
}

function computeBookingStatus(row) {
  if (row.status === 'Cancelled') return 'Cancelled';
  const now = new Date();
  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Ongoing';
  return 'Completed';
}

function formatBookingRow(row) {
  const computedStatus = computeBookingStatus(row);
  return {
    ...row,
    status: computedStatus,
  };
}

async function listBookings(filters = {}) {
  const { resource_id, resourceAssetId, from, to } = filters;
  const targetId = resource_id || resourceAssetId;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (targetId) {
    conditions.push(`b.resource_asset_id = $${paramIndex++}`);
    params.push(targetId);
  }

  if (from) {
    conditions.push(`b.end_time >= $${paramIndex++}`);
    params.push(new Date(from).toISOString());
  }

  if (to) {
    conditions.push(`b.start_time <= $${paramIndex++}`);
    params.push(new Date(to).toISOString());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const res = await query(
    `SELECT b.*,
            a.asset_tag, a.name AS resource_asset_name,
            u.name AS booked_by_name, u.email AS booked_by_email
     FROM bookings b
     JOIN assets a ON b.resource_asset_id = a.id
     JOIN users u ON b.booked_by = u.id
     ${whereClause}
     ORDER BY b.start_time ASC`,
    params
  );

  return res.rows.map(formatBookingRow);
}

async function getUpcomingReminders(userId) {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const res = await query(
    `SELECT b.*, a.asset_tag, a.name AS resource_asset_name
     FROM bookings b
     JOIN assets a ON b.resource_asset_id = a.id
     WHERE b.booked_by = $1
       AND b.status <> 'Cancelled'
       AND b.start_time >= $2
       AND b.start_time <= $3
     ORDER BY b.start_time ASC`,
    [userId, now.toISOString(), next24h.toISOString()]
  );

  // Note: Polling endpoint for upcoming reminders tradeoff documented per prompt
  return res.rows.map(formatBookingRow);
}

async function cancelBooking(bookingId, user) {
  const bRes = await query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (bRes.rows.length === 0) {
    throw new NotFoundError('Booking not found');
  }
  const booking = bRes.rows[0];

  if (booking.booked_by !== user.id && !['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('You do not have permission to cancel this booking.');
  }

  const updated = await query(
    `UPDATE bookings SET status = 'Cancelled' WHERE id = $1 RETURNING *`,
    [bookingId]
  );

  return formatBookingRow(updated.rows[0]);
}

async function rescheduleBooking(bookingId, payload, user) {
  const { startTime, endTime } = payload;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new BadRequestError('End time must be after start time.');
  }

  const bRes = await query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (bRes.rows.length === 0) {
    throw new NotFoundError('Booking not found');
  }
  const booking = bRes.rows[0];

  if (booking.booked_by !== user.id && !['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('You do not have permission to reschedule this booking.');
  }

  // Overlap pre-check excluding current booking
  const overlapRes = await query(
    `SELECT b.id, b.start_time, b.end_time, b.purpose, u.name AS booked_by_name
     FROM bookings b
     LEFT JOIN users u ON b.booked_by = u.id
     WHERE b.resource_asset_id = $1
       AND b.id <> $2
       AND b.status <> 'Cancelled'
       AND b.start_time < $3
       AND b.end_time > $4
     LIMIT 1`,
    [booking.resource_asset_id, bookingId, end.toISOString(), start.toISOString()]
  );

  if (overlapRes.rows.length > 0) {
    const conflict = overlapRes.rows[0];
    throw new BookingOverlapError(
      `Rescheduled slot overlaps with existing booking by ${conflict.booked_by_name || 'another user'}.`,
      {
        id: conflict.id,
        bookedByName: conflict.booked_by_name,
        startTime: conflict.start_time,
        endTime: conflict.end_time,
      }
    );
  }

  const updated = await query(
    `UPDATE bookings SET start_time = $1, end_time = $2 WHERE id = $3 RETURNING *`,
    [start.toISOString(), end.toISOString(), bookingId]
  );

  return formatBookingRow(updated.rows[0]);
}

module.exports = {
  createBooking,
  listBookings,
  getUpcomingReminders,
  cancelBooking,
  rescheduleBooking,
  BookingOverlapError,
};
