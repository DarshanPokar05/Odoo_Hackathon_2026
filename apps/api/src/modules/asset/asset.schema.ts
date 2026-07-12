import { z } from 'zod';
import { AssetStatus, Condition } from '@prisma/client';

export const CreateAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(150),
    categoryId: z.string().uuid('Invalid category ID'),
    serialNumber: z.string().max(100).optional(),
    manufacturer: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    acquisitionDate: z.string().datetime().optional().nullable(),
    acquisitionCost: z.number().nonnegative().optional(),
    currentValue: z.number().nonnegative().optional(),
    location: z.string().max(200).optional(),
    condition: z.nativeEnum(Condition).optional(),
    isBookable: z.boolean().optional(),
  }),
});

export const UpdateAssetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid asset ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    categoryId: z.string().uuid().optional(),
    serialNumber: z.string().max(100).optional(),
    manufacturer: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    acquisitionDate: z.string().datetime().optional().nullable(),
    acquisitionCost: z.number().nonnegative().optional(),
    currentValue: z.number().nonnegative().optional(),
    location: z.string().max(200).optional(),
    condition: z.nativeEnum(Condition).optional(),
    status: z.nativeEnum(AssetStatus).optional(),
    isBookable: z.boolean().optional(),
  }),
});

export const AssetIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid asset ID'),
  }),
});
