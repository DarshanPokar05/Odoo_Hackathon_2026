import { Router } from 'express';
import { AllocationController } from './allocation.controller';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import { validate } from '../../middlewares/validationMiddleware';
import { 
  AllocateAssetSchema, 
  ReturnAssetSchema, 
  TransferRequestSchema, 
  TransferActionSchema,
  AllocationIdParamSchema
} from './allocation.schema';

const router = Router();

// Require authentication for all routes
router.use(authenticate);

// Allocation Endpoints (ASSET_MANAGER only)
router.post(
  '/',
  authorize('ASSET_MANAGER'),
  validate(AllocateAssetSchema),
  AllocationController.allocateAsset
);

router.get(
  '/',
  authorize('ASSET_MANAGER'),
  AllocationController.getActiveAllocations
);

router.get(
  '/overdue',
  authorize('ASSET_MANAGER'),
  AllocationController.getOverdueAllocations
);

router.get(
  '/:id',
  authorize('ASSET_MANAGER'),
  validate(AllocationIdParamSchema),
  AllocationController.getAllocationDetails
);

router.patch(
  '/:id/return',
  authorize('ASSET_MANAGER'),
  validate(ReturnAssetSchema),
  AllocationController.returnAsset
);

// Transfer Endpoints
router.post(
  '/transfers',
  authorize('EMPLOYEE', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), // Assuming employees can request
  validate(TransferRequestSchema),
  AllocationController.requestTransfer
);

router.patch(
  '/transfers/:id/approve',
  authorize('ASSET_MANAGER'),
  validate(TransferActionSchema),
  AllocationController.approveTransfer
);

router.patch(
  '/transfers/:id/reject',
  authorize('ASSET_MANAGER'),
  validate(TransferActionSchema),
  AllocationController.rejectTransfer
);

export default router;
