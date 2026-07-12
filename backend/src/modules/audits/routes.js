const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.listAuditCycles);
router.post('/', controller.createAuditCycle);
router.get('/:id', controller.getAuditCycle);
router.post('/:id/auditors', controller.assignAuditors);
router.post('/:id/start', controller.startAuditCycle);
router.patch('/:id/items/:itemId', controller.updateAuditItem);
router.post('/:id/close', controller.closeAuditCycle);
router.get('/:id/discrepancies', controller.getDiscrepancies);

module.exports = router;
