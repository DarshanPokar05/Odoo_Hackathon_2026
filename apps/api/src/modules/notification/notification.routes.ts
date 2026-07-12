import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead); // Needs to be before /:id
router.get('/:id', notificationController.getNotificationById);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export const notificationRoutes = router;
