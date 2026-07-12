import { z } from 'zod';

export const AllocateAssetSchema = z.object({
  body: z.object({
    assetId: z.string().uuid('Invalid Asset ID'),
    allocatedTo: z.string().uuid('Invalid User ID'),
    expectedReturnDate: z.string().datetime({ offset: true }).optional(),
    remarks: z.string().max(500).optional(),
  }),
});

export const ReturnAssetSchema = z.object({
  body: z.object({
    conditionAfter: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN']),
    remarks: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid Allocation ID'),
  }),
});

export const TransferRequestSchema = z.object({
  body: z.object({
    assetId: z.string().uuid('Invalid Asset ID'),
    requestedTo: z.string().uuid('Invalid Target User ID'),
    reason: z.string().max(500).optional(),
  }),
});

export const TransferActionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Transfer ID'),
  }),
});

export const AllocationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Allocation ID'),
  }),
});
