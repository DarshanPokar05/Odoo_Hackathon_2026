const service = require('./service');
const { sendSuccess } = require('../../utils/response');

async function getUtilization(req, res, next) {
  try {
    const data = await service.getUtilization();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

async function getMaintenanceFrequency(req, res, next) {
  try {
    const data = await service.getMaintenanceFrequency();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

async function getDueForMaintenanceOrRetirement(req, res, next) {
  try {
    const items = await service.getDueForMaintenanceOrRetirement();
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

async function getDepartmentAllocationSummary(req, res, next) {
  try {
    const items = await service.getDepartmentAllocationSummary();
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

async function getBookingHeatmap(req, res, next) {
  try {
    const items = await service.getBookingHeatmap();
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

async function exportReport(req, res, next) {
  try {
    const { type = 'utilization' } = req.query;
    await service.streamCsvExport(type, res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUtilization,
  getMaintenanceFrequency,
  getDueForMaintenanceOrRetirement,
  getDepartmentAllocationSummary,
  getBookingHeatmap,
  exportReport,
};
