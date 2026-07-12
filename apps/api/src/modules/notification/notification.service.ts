import { NotFoundError } from '../../shared/errors/customErrors';
import { CreateNotificationDto, NotificationQueryDto } from './notification.dto';
import { NotificationRepository } from './notification.repository';

export class NotificationService {
  private repository: NotificationRepository;

  constructor() {
    this.repository = new NotificationRepository();
  }

  async createNotification(data: CreateNotificationDto) {
    return this.repository.create(data);
  }

  async getNotifications(userId: string, query: NotificationQueryDto) {
    const { notifications, total } = await this.repository.findMany(userId, query);
    const unreadCount = await this.repository.getUnreadCount(userId);

    return {
      notifications,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        unreadCount,
      },
    };
  }

  async getNotificationById(id: string, userId: string) {
    const notification = await this.repository.findById(id, userId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.getNotificationById(id, userId);
    
    if (notification.isRead) {
      return notification;
    }

    return this.repository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);
    return { success: true };
  }

  async deleteNotification(id: string, userId: string) {
    await this.getNotificationById(id, userId);
    await this.repository.softDelete(id, userId);
    return { success: true };
  }
}
