const service = require('./service');
const { sendSuccess } = require('../../utils/response');
const { z } = require('zod');

async function listMaintenance(req, res, next) {
  try {
    const items = await service.listMaintenance(req.query);
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

const createSchema = z.object({
  assetId: z.string().uuid(),
  issueDescription: z.string().min(1),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
  photoUrl: z.string().optional().nullable(),
});

async function createRequest(req, res, next) {
  try {
    const validated = createSchema.parse(req.body);
    const item = await service.createRequest(validated, req.user);
    return sendSuccess(res, { item }, 201);
  } catch (err) {
    next(err);
  }
}

async function approveRequest(req, res, next) {
  try {
    const item = await service.approveRequest(req.params.id, req.user);
    return sendSuccess(res, { item });
  } catch (err) {
    next(err);
  }
}

async function rejectRequest(req, res, next) {
  try {
    const item = await service.rejectRequest(req.params.id, req.user);
    return sendSuccess(res, { item });
  } catch (err) {
    next(err);
  }
}

const assignSchema = z.object({
  technicianName: z.string().min(1),
});

async function assignTechnician(req, res, next) {
  try {
    const validated = assignSchema.parse(req.body);
    const item = await service.assignTechnician(req.params.id, validated.technicianName, req.user);
    return sendSuccess(res, { item });
  } catch (err) {
    next(err);
  }
}

async function startMaintenance(req, res, next) {
  try {
    const item = await service.startMaintenance(req.params.id, req.user);
    return sendSuccess(res, { item });
  } catch (err) {
    next(err);
  }
}

async function resolveMaintenance(req, res, next) {
  try {
    const item = await service.resolveMaintenance(req.params.id, req.user);
    return sendSuccess(res, { item });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMaintenance,
  createRequest,
  approveRequest,
  rejectRequest,
  assignTechnician,
  startMaintenance,
  resolveMaintenance,
};
