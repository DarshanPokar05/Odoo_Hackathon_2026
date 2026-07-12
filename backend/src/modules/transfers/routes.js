const express = require('express');
const controller = require('../allocations/controller');
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/', authenticate, controller.listTransferRequests);
router.post('/', authenticate, controller.createTransferRequest);
router.patch('/:id/approve', authenticate, requireRole('Admin', 'AssetManager', 'DepartmentHead'), controller.approveTransferRequest);
router.patch('/:id/reject', authenticate, requireRole('Admin', 'AssetManager', 'DepartmentHead'), controller.rejectTransferRequest);

module.exports = router;
