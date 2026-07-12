const service = require('./service');
const { sendSuccess } = require('../../utils/response');
const { z } = require('zod');

const createBookingSchema = z.object({
  resourceAssetId: z.string().uuid(),
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().optional(),
});

async function createBooking(req, res, next) {
  try {
    const validated = createBookingSchema.parse(req.body);
    const booking = await service.createBooking(validated, req.user);
    return sendSuccess(res, { booking }, 201);
  } catch (err) {
    next(err);
  }
}

async function listBookings(req, res, next) {
  try {
    const items = await service.listBookings(req.query);
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

async function getUpcomingReminders(req, res, next) {
  try {
    const items = await service.getUpcomingReminders(req.user.id);
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await service.cancelBooking(req.params.id, req.user);
    return sendSuccess(res, { booking });
  } catch (err) {
    next(err);
  }
}

const rescheduleSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
});

async function rescheduleBooking(req, res, next) {
  try {
    const validated = rescheduleSchema.parse(req.body);
    const booking = await service.rescheduleBooking(req.params.id, validated, req.user);
    return sendSuccess(res, { booking });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  listBookings,
  getUpcomingReminders,
  cancelBooking,
  rescheduleBooking,
};
