import prisma from '../../infrastructure/database/prisma';
import { Prisma } from '@prisma/client';
import { CreateNotificationDto, NotificationQueryDto } from './notification.dto';

export class NotificationRepository {
  async create(data: CreateNotificationDto) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        event: data.event,
        metadata: data.metadata ?? {},
      },
    });
  }

  async findMany(userId: string, query: NotificationQueryDto) {
    const { unreadOnly, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.NotificationWhereInput = {
      userId,
      isDeleted: false,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    return { notifications, total };
  }

  async findById(id: string, userId: string) {
    return prisma.notification.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async softDelete(id: string, userId: string) {
    return prisma.notification.update({
      where: { id, userId },
      data: {
        isDeleted: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
      },
    });
  }
}
