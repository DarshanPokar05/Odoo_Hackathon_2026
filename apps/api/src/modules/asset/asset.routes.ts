import { Router } from 'express';
import { AssetController } from './asset.controller';
import { validate } from '../../middlewares/validationMiddleware';
import { ActivityController } from '../activity/activity.controller';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import { CreateAssetSchema, UpdateAssetSchema, AssetIdParamSchema } from './asset.schema';

const router = Router();

// Only ASSET_MANAGER (and ADMIN) can register assets
router.post(
  '/',
  authenticate,
  authorize('ASSET_MANAGER'),
  validate(CreateAssetSchema),
  AssetController.registerAsset
);

// Any authenticated user can view assets
router.get('/', authenticate, AssetController.getAssets);

router.get(
  '/:id',
  authenticate,
  validate(AssetIdParamSchema),
  AssetController.getAssetDetails
);

router.patch(
  '/:id',
  authenticate,
  authorize('ASSET_MANAGER'),
  validate(UpdateAssetSchema),
  AssetController.updateAsset
);

router.delete(
  '/:id',
  authenticate,
  authorize('ASSET_MANAGER'),
  validate(AssetIdParamSchema),
  AssetController.deleteAsset
);

router.get(
  '/:id/history',
  authenticate,
  validate(AssetIdParamSchema),
  AssetController.getAssetTimeline
);

router.get(
  '/:id/activity',
  authenticate,
  authorize('ASSET_MANAGER', 'SYSTEM_ADMIN', 'ADMIN'),
  ActivityController.getAssetLogs
);

export default router;
