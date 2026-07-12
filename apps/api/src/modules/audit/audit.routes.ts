import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import { validate } from '../../middlewares/validationMiddleware';
import {
  CreateAuditSchema,
  AssignAuditorSchema,
  VerifyAssetsSchema,
  CloseAuditSchema,
} from './audit.schema';

const router = Router();

// Apply auth middleware to all audit routes
router.use(authenticate);

router.post(
  '/',
  authorize('SYSTEM_ADMIN', 'DEPARTMENT_HEAD', 'ASSET_MANAGER'),
  validate(CreateAuditSchema),
  AuditController.createAudit
);

router.get(
  '/',
  authorize('SYSTEM_ADMIN', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'AUDITOR'),
  AuditController.getAudits
);

router.get(
  '/:id',
  authorize('SYSTEM_ADMIN', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'AUDITOR'),
  AuditController.getAuditDetails
);

router.patch(
  '/:id/assign',
  authorize('SYSTEM_ADMIN', 'DEPARTMENT_HEAD', 'ASSET_MANAGER'),
  validate(AssignAuditorSchema),
  AuditController.assignAuditors
);

router.patch(
  '/:id/verify',
  authorize('SYSTEM_ADMIN', 'ASSET_MANAGER', 'AUDITOR'),
  validate(VerifyAssetsSchema),
  AuditController.verifyAssets
);

router.patch(
  '/:id/close',
  authorize('SYSTEM_ADMIN', 'DEPARTMENT_HEAD', 'ASSET_MANAGER'),
  validate(CloseAuditSchema),
  AuditController.closeAudit
);

router.get(
  '/:id/report',
  authorize('SYSTEM_ADMIN', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'AUDITOR'),
  AuditController.getReport
);

export default router;
