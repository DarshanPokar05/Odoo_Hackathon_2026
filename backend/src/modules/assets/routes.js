const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/', authenticate, controller.listAssets);
router.post('/', authenticate, requireRole('Admin', 'AssetManager'), controller.createAsset);
router.get('/:id/history', authenticate, controller.getAssetHistory);
router.get('/:id', authenticate, controller.getAssetById);
router.patch('/:id/status', authenticate, controller.updateAssetStatus);

module.exports = router;
