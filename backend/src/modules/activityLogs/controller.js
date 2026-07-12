const service = require('./service');
const { sendSuccess } = require('../../utils/response');

async function listLogs(req, res, next) {
  try {
    const data = await service.listActivityLogs(req.query);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listLogs };
