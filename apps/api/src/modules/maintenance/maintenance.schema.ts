import { z } from 'zod';
import { MaintenancePriority } from '@prisma/client';

export const raiseMaintenanceSchema = z.object({
  assetId: z.string().uuid({ message: 'Valid Asset ID is required' }),
  priority: z.nativeEnum(MaintenancePriority).optional().default(MaintenancePriority.LOW),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  photoUrl: z.string().url().optional(),
});

export const approveMaintenanceSchema = z.object({
  remarks: z.string().optional(),
});

export const rejectMaintenanceSchema = z.object({
  remarks: z.string().min(5, { message: 'Rejection requires remarks' }),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid({ message: 'Valid Technician ID is required' }),
});

export const resolveMaintenanceSchema = z.object({
  remarks: z.string().min(5, { message: 'Resolution requires remarks' }),
});

export const closeMaintenanceSchema = z.object({
  remarks: z.string().optional(),
});
