import { z } from 'zod';
import { ReportQuerySchema, ExportQuerySchema } from './report.schema';

export type ReportQueryFilters = z.infer<typeof ReportQuerySchema>['query'];
export type ExportQueryFilters = z.infer<typeof ExportQuerySchema>['query'];

export interface AssetUtilizationReport {
  totalAssets: number;
  allocatedAssets: number;
  availableAssets: number;
  reservedAssets: number;
  underMaintenance: number;
  disposedAssets: number;
  utilizationPercentage: number;
  byCategory: { category: string; count: number }[];
  byCondition: { condition: string; count: number }[];
}

export interface AllocationReport {
  totalAllocations: number;
  activeAllocations: number;
  overdueAllocations: number;
  upcomingReturns: number;
  departmentWise: { department: string; count: number }[];
}

export interface MaintenanceReport {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  resolvedRequests: number;
  totalCost: number;
  priorityBreakdown: { priority: string; count: number }[];
}

export interface BookingReport {
  totalBookings: number;
  upcomingBookings: number;
  ongoingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  cancellationRate: number;
  byResource: { resourceName: string; count: number }[];
}

export interface AuditReportMock {
  auditCycles: number;
  verifiedAssets: number;
  missingAssets: number;
  damagedAssets: number;
  compliancePercentage: number;
  discrepancyReports: number;
}
