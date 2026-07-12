import { z } from 'zod';

export const CreateResourceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Resource name must be at least 2 characters'),
    assetId: z.string().uuid('Invalid assetId UUID').optional(),
    resourceType: z.string().min(2, 'Resource type is required'),
    capacity: z.number().int().positive('Capacity must be a positive integer').default(1),
    location: z.string().min(2, 'Location is required'),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  }),
});

export const UpdateResourceSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    assetId: z.string().uuid().optional(),
    resourceType: z.string().min(2).optional(),
    capacity: z.number().int().positive().optional(),
    location: z.string().min(2).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const CreateBookingSchema = z.object({
  body: z
    .object({
      resourceId: z.string().uuid('Invalid resourceId UUID'),
      startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),
      endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),
      purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
      remarks: z.string().optional(),
    })
    .refine(
      (data) => new Date(data.startTime).getTime() < new Date(data.endTime).getTime(),
      {
        message: 'startTime must be before endTime',
        path: ['endTime'],
      }
    ),
});

export const UpdateBookingSchema = z.object({
  body: z
    .object({
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      purpose: z.string().min(3).optional(),
      remarks: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.startTime && data.endTime) {
          return new Date(data.startTime).getTime() < new Date(data.endTime).getTime();
        }
        return true;
      },
      {
        message: 'startTime must be before endTime',
        path: ['endTime'],
      }
    ),
});

export const BookingQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
    resourceId: z.string().uuid().optional(),
    bookedBy: z.string().uuid().optional(),
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    sortBy: z.enum(['startTime', 'endTime', 'createdAt']).optional().default('startTime'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const ResourceQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
    resourceType: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    sortBy: z.enum(['name', 'resourceType', 'capacity', 'createdAt']).optional().default('name'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});

export const AvailableResourceSchema = z.object({
  query: z
    .object({
      startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),
      endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),
      resourceType: z.string().optional(),
      minCapacity: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
      location: z.string().optional(),
    })
    .refine(
      (data) => new Date(data.startTime).getTime() < new Date(data.endTime).getTime(),
      {
        message: 'startTime must be before endTime',
        path: ['endTime'],
      }
    ),
});

export const CalendarQuerySchema = z.object({
  query: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }),
});
