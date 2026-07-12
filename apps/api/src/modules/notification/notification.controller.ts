import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { QueryNotificationSchema } from './notification.schema';
import { sendSuccess } from '../../shared/utils/responseHelper';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Assuming userId is attached to req by auth middleware
      const userId = (req as Request & { user?: { id: string } }).user?.id; 
      
      const query = QueryNotificationSchema.parse(req.query);
      const parsedQuery = {
        unreadOnly: query.unreadOnly === 'true',
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 10,
      };

      const result = await this.notificationService.getNotifications(userId, parsedQuery);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      const { id } = req.params;

      const notification = await this.notificationService.getNotificationById(id, userId);
      return sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      const { id } = req.params;

      const notification = await this.notificationService.markAsRead(id, userId);
      return sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;

      const result = await this.notificationService.markAllAsRead(userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      const { id } = req.params;

      const result = await this.notificationService.deleteNotification(id, userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
