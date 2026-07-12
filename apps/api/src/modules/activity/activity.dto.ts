import { z } from 'zod';
import { ActivityLogQuerySchema, ActivityLogExportSchema } from './activity.schema';
import { ActivityLog, User } from '@prisma/client';

export type ActivityLogQueryFilters = z.infer<typeof ActivityLogQuerySchema>['query'];
export type ActivityLogExportFilters = z.infer<typeof ActivityLogExportSchema>['query'];

export interface ActivityLogResponse {
  data: (ActivityLog & { user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> | null })[];
  meta: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}
