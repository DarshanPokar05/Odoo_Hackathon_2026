const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.listNotifications);
router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);

module.exports = router;
