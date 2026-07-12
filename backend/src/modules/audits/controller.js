const service = require('./service');
const { sendSuccess } = require('../../utils/response');
const { z } = require('zod');

async function listAuditCycles(req, res, next) {
  try {
    const items = await service.listAuditCycles();
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

async function getAuditCycle(req, res, next) {
  try {
    const cycle = await service.getAuditCycle(req.params.id);
    return sendSuccess(res, { cycle });
  } catch (err) {
    next(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  scopeDepartmentId: z.string().uuid().optional().nullable(),
  scopeLocation: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  auditorIds: z.array(z.string().uuid()).optional(),
});

async function createAuditCycle(req, res, next) {
  try {
    const validated = createSchema.parse(req.body);
    const cycle = await service.createAuditCycle(validated, req.user);
    return sendSuccess(res, { cycle }, 201);
  } catch (err) {
    next(err);
  }
}

const assignSchema = z.object({
  auditorIds: z.array(z.string().uuid()),
});

async function assignAuditors(req, res, next) {
  try {
    const validated = assignSchema.parse(req.body);
    const cycle = await service.assignAuditors(req.params.id, validated.auditorIds, req.user);
    return sendSuccess(res, { cycle });
  } catch (err) {
    next(err);
  }
}

async function startAuditCycle(req, res, next) {
  try {
    const cycle = await service.startAuditCycle(req.params.id, req.user);
    return sendSuccess(res, { cycle });
  } catch (err) {
    next(err);
  }
}

const updateItemSchema = z.object({
  verificationStatus: z.enum(['Pending', 'Verified', 'Missing', 'Damaged']),
  notes: z.string().optional().nullable(),
});

async function updateAuditItem(req, res, next) {
  try {
    const validated = updateItemSchema.parse(req.body);
    const item = await service.updateAuditItem(req.params.id, req.params.itemId, validated, req.user);
    return sendSuccess(res, { item });
  } catch (err) {
    next(err);
  }
}

async function closeAuditCycle(req, res, next) {
  try {
    const cycle = await service.closeAuditCycle(req.params.id, req.user);
    return sendSuccess(res, { cycle });
  } catch (err) {
    next(err);
  }
}

async function getDiscrepancies(req, res, next) {
  try {
    const items = await service.getDiscrepancies(req.params.id);
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAuditCycles,
  getAuditCycle,
  createAuditCycle,
  assignAuditors,
  startAuditCycle,
  updateAuditItem,
  closeAuditCycle,
  getDiscrepancies,
};
