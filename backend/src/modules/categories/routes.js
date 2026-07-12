const express = require('express');
const controller = require('./controller');
const authenticate = require('../../middleware/auth');
const requireRole = require('../../middleware/rbac');

const router = express.Router();

router.get('/', authenticate, controller.listCategories);
router.get('/:id', authenticate, controller.getCategoryById);
router.post('/', authenticate, requireRole('Admin'), controller.createCategory);
router.put('/:id', authenticate, requireRole('Admin'), controller.updateCategory);
router.delete('/:id', authenticate, requireRole('Admin'), controller.deleteCategory);

module.exports = router;
