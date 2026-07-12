import { z } from 'zod';

export const ReportQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    location: z.string().optional(),
    status: z.string().optional(),
    userId: z.string().uuid().optional(),
  }),
});

export const ExportQuerySchema = ReportQuerySchema.extend({
  query: ReportQuerySchema.shape.query.extend({
    format: z.enum(['pdf', 'excel', 'csv']),
    reportType: z.enum(['assets', 'allocations', 'maintenance', 'bookings', 'audits']),
  }),
});
