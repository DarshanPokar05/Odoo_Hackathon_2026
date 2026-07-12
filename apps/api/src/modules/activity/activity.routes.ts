import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Only admins can access the global activity logs list and export
router.get('/', authorize('ADMIN', 'SYSTEM_ADMIN'), ActivityController.getLogs);
router.get('/export', authorize('ADMIN', 'SYSTEM_ADMIN'), ActivityController.exportLogs);

// Anyone can access a specific log if they have the ID (or we can restrict this too, but prompt doesn't specify)
// Best practice: Restrict to admins
router.get('/:id', authorize('ADMIN', 'SYSTEM_ADMIN'), ActivityController.getLogById);

export default router;
