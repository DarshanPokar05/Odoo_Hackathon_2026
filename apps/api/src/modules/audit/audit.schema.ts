import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';

export const CreateAuditSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    departmentId: z.string().uuid('Invalid department ID'),
    location: z.string().optional(),
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date'),
  })
});

export const AssignAuditorSchema = z.object({
  body: z.object({
    auditorIds: z.array(z.string().uuid('Invalid auditor ID')).min(1, 'At least one auditor must be assigned'),
  })
});

export const VerifyAssetItemSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  verificationStatus: z.nativeEnum(VerificationStatus),
  remarks: z.string().optional(),
});

export const VerifyAssetsSchema = z.object({
  body: z.object({
    items: z.array(VerifyAssetItemSchema).min(1, 'At least one item must be verified'),
  })
});

export const CloseAuditSchema = z.object({
  body: z.object({
    remarks: z.string().optional(),
  })
});
