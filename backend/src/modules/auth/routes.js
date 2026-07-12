const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

router.post('/login', controller.login);
router.post('/signup', controller.signup);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.get('/me', authenticate, controller.me);

module.exports = router;
