import { z } from 'zod';
import { NotificationType } from '@prisma/client';

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.nativeEnum(NotificationType),
  event: z.string().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
});

export const QueryNotificationSchema = z.object({
  unreadOnly: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
