const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.listMaintenance);
router.post('/', controller.createRequest);
router.patch('/:id/approve', controller.approveRequest);
router.patch('/:id/reject', controller.rejectRequest);
router.patch('/:id/assign-technician', controller.assignTechnician);
router.patch('/:id/start', controller.startMaintenance);
router.patch('/:id/resolve', controller.resolveMaintenance);

module.exports = router;
