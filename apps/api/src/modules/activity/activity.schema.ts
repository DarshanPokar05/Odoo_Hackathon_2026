import { z } from 'zod';

export const ActivityLogQuerySchema = z.object({
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    userId: z.string().uuid().optional(),
    module: z.string().optional(),
    action: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().uuid().optional(),
    role: z.string().optional(),
    ipAddress: z.string().optional(),
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(),
  }),
});

export const ActivityLogExportSchema = ActivityLogQuerySchema.extend({
  query: ActivityLogQuerySchema.shape.query.extend({
    format: z.enum(['pdf', 'excel', 'csv']),
  }),
});
