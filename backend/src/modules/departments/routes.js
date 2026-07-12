const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/', authenticate, controller.listDepartments);
router.get('/tree', authenticate, controller.getDepartmentTree);
router.post('/', authenticate, requireRole('Admin'), controller.createDepartment);
router.put('/:id', authenticate, requireRole('Admin'), controller.updateDepartment);
router.patch('/:id/status', authenticate, requireRole('Admin'), controller.updateDepartmentStatus);

module.exports = router;
