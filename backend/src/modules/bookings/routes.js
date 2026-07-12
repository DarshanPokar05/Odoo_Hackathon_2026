const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/upcoming-reminders', controller.getUpcomingReminders);
router.get('/', controller.listBookings);
router.post('/', controller.createBooking);
router.patch('/:id/cancel', controller.cancelBooking);
router.patch('/:id/reschedule', controller.rescheduleBooking);

module.exports = router;
