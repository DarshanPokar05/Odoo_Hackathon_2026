const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/overdue', authenticate, controller.listOverdueAllocations);
router.get('/transfers', authenticate, controller.listTransferRequests);
router.post('/transfers', authenticate, controller.createTransferRequest);
router.patch('/transfers/:id/approve', authenticate, requireRole('Admin', 'AssetManager', 'DepartmentHead'), controller.approveTransferRequest);
router.patch('/transfers/:id/reject', authenticate, requireRole('Admin', 'AssetManager', 'DepartmentHead'), controller.rejectTransferRequest);

router.get('/', authenticate, controller.listAllocations);
router.post('/', authenticate, requireRole('Admin', 'AssetManager', 'DepartmentHead'), controller.createAllocation);
router.post('/:id/return', authenticate, requireRole('Admin', 'AssetManager'), controller.returnAllocation);

module.exports = router;
