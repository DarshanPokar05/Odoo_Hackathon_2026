import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  event: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationQueryDto {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}
