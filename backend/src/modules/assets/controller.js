const service = require('./service');
const { sendPaginated, sendSuccess } = require('../../utils/response');
const { z } = require('zod');

async function listAssets(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { items, total } = await service.listAssets(req.query);
    return sendPaginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

async function getAssetById(req, res, next) {
  try {
    const asset = await service.getAssetById(req.params.id);
    return sendSuccess(res, { asset });
  } catch (err) {
    next(err);
  }
}

async function getAssetHistory(req, res, next) {
  try {
    const historyData = await service.getAssetHistory(req.params.id);
    return sendSuccess(res, historyData);
  } catch (err) {
    next(err);
  }
}

const createAssetSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().uuid(),
  serialNumber: z.string().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  location: z.string().optional().default('HQ Store Room'),
  departmentId: z.string().uuid().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  isBookable: z.boolean().optional().default(false),
  customFields: z.record(z.any()).optional().default({}),
});

async function createAsset(req, res, next) {
  try {
    const validated = createAssetSchema.parse(req.body);
    const asset = await service.createAsset(validated, req.user);
    return sendSuccess(res, { asset }, 201);
  } catch (err) {
    next(err);
  }
}

const updateStatusSchema = z.object({
  status: z.string().min(1),
});

async function updateAssetStatus(req, res, next) {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const asset = await service.updateAssetStatus(req.params.id, status, req.user);
    return sendSuccess(res, { asset });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAssets,
  getAssetById,
  getAssetHistory,
  createAsset,
  updateAssetStatus,
};
