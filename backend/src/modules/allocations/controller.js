const service = require('./service');
const { sendPaginated, sendSuccess } = require('../../utils/response');
const { z } = require('zod');

async function listAllocations(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { items, total } = await service.listAllocations(req.query);
    return sendPaginated(res, items, total, page, limit);
  } catch (err) {
    next(err);
  }
}

async function listOverdueAllocations(req, res, next) {
  try {
    const overdueList = await service.listOverdueAllocations();
    return sendSuccess(res, { overdueAllocations: overdueList });
  } catch (err) {
    next(err);
  }
}

const createAllocationSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  expectedReturnDate: z.string().optional().nullable(),
});

async function createAllocation(req, res, next) {
  try {
    const validated = createAllocationSchema.parse(req.body);
    const allocation = await service.createAllocation(validated, req.user);
    return sendSuccess(res, { allocation }, 201);
  } catch (err) {
    // Check if error is ConflictError (either from service layer check or DB unique violation)
    if (err.statusCode === 409 || err.code === 'ASSET_ALREADY_ALLOCATED') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ASSET_ALREADY_ALLOCATED',
          message: err.message || 'Currently held by another user',
          currentHolder: err.currentHolder || null,
          offerTransfer: true,
        },
      });
    }
    next(err);
  }
}

const returnSchema = z.object({
  conditionCheckinNotes: z.string().optional().default('Good condition on return'),
});

async function returnAllocation(req, res, next) {
  try {
    const { conditionCheckinNotes } = returnSchema.parse(req.body);
    const allocation = await service.returnAllocation(
      req.params.id,
      conditionCheckinNotes,
      req.user
    );
    return sendSuccess(res, { allocation });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// TRANSFERS CONTROLLERS
// ==========================================

async function listTransferRequests(req, res, next) {
  try {
    const transfers = await service.listTransferRequests(req.query);
    return sendSuccess(res, { transfers });
  } catch (err) {
    next(err);
  }
}

const createTransferSchema = z.object({
  assetId: z.string().uuid(),
  requestedToUserId: z.string().uuid(),
  reason: z.string().min(1),
});

async function createTransferRequest(req, res, next) {
  try {
    const validated = createTransferSchema.parse(req.body);
    const transfer = await service.createTransferRequest(validated, req.user);
    return sendSuccess(res, { transfer }, 201);
  } catch (err) {
    next(err);
  }
}

async function approveTransferRequest(req, res, next) {
  try {
    const result = await service.approveTransferRequest(req.params.id, req.user);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function rejectTransferRequest(req, res, next) {
  try {
    const transfer = await service.rejectTransferRequest(req.params.id, req.user);
    return sendSuccess(res, { transfer });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAllocations,
  listOverdueAllocations,
  createAllocation,
  returnAllocation,
  listTransferRequests,
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
};
