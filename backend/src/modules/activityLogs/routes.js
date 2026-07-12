const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.use(authenticate);
router.get('/', requireRole('Admin'), controller.listLogs);

module.exports = router;
