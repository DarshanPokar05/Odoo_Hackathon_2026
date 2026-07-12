const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/utilization', controller.getUtilization);
router.get('/maintenance-frequency', controller.getMaintenanceFrequency);
router.get('/due-for-maintenance-or-retirement', controller.getDueForMaintenanceOrRetirement);
router.get('/department-allocation-summary', controller.getDepartmentAllocationSummary);
router.get('/booking-heatmap', controller.getBookingHeatmap);
router.get('/export', controller.exportReport);

module.exports = router;
