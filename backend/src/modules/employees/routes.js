const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/', authenticate, controller.listEmployees);
router.patch('/:id/role', authenticate, requireRole('Admin'), controller.updateEmployeeRole);
router.patch('/:id/status', authenticate, requireRole('Admin'), controller.updateEmployeeStatus);

module.exports = router;
