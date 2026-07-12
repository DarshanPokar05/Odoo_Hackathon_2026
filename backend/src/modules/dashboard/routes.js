const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

router.get('/', authenticate, controller.getDashboardSummary);
router.get('/kpis', authenticate, controller.getDashboardSummary);

module.exports = router;
