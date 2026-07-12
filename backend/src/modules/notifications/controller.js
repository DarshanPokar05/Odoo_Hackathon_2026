const service = require('./service');
const { sendSuccess } = require('../../utils/response');

async function listNotifications(req, res, next) {
  try {
    const items = await service.listMyNotifications(req.user.id);
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const item = await service.markAsRead(req.params.id, req.user.id);
    return sendSuccess(res, { item });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await service.markAllAsRead(req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markAsRead, markAllAsRead };
