import { z } from 'zod';
import {
  raiseMaintenanceSchema,
  approveMaintenanceSchema,
  rejectMaintenanceSchema,
  assignTechnicianSchema,
  resolveMaintenanceSchema,
  closeMaintenanceSchema
} from './maintenance.schema';

export type RaiseMaintenanceDTO = z.infer<typeof raiseMaintenanceSchema>;
export type ApproveMaintenanceDTO = z.infer<typeof approveMaintenanceSchema>;
export type RejectMaintenanceDTO = z.infer<typeof rejectMaintenanceSchema>;
export type AssignTechnicianDTO = z.infer<typeof assignTechnicianSchema>;
export type ResolveMaintenanceDTO = z.infer<typeof resolveMaintenanceSchema>;
export type CloseMaintenanceDTO = z.infer<typeof closeMaintenanceSchema>;
