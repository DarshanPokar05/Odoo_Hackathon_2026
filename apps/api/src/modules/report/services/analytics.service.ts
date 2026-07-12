import { ReportRepository } from '../report.repository';
import { 
  ReportQueryFilters, 
  AssetUtilizationReport, 
  AllocationReport, 
  MaintenanceReport, 
  BookingReport, 
  AuditReportMock 
} from '../report.dto';

export class AnalyticsService {
  static async getAssetUtilization(filters: ReportQueryFilters): Promise<AssetUtilizationReport> {
    const stats = await ReportRepository.getAssetStats(filters);

    const getStatusCount = (status: string) => stats.statusGroups.find((g: any) => g.status === status)?._count.id || 0;
    
    const allocated = getStatusCount('ALLOCATED');
    const available = getStatusCount('AVAILABLE');
    const reserved = getStatusCount('RESERVED');
    const maintenance = getStatusCount('UNDER_MAINTENANCE');
    const disposed = getStatusCount('DISPOSED');

    const totalInUse = allocated + reserved;
    const utilizationPercentage = stats.total > 0 ? (totalInUse / stats.total) * 100 : 0;

    return {
      totalAssets: stats.total,
      allocatedAssets: allocated,
      availableAssets: available,
      reservedAssets: reserved,
      underMaintenance: maintenance,
      disposedAssets: disposed,
      utilizationPercentage: parseFloat(utilizationPercentage.toFixed(2)),
      byCategory: stats.categoryGroups,
      byCondition: stats.conditionGroups.map((g: any) => ({
        condition: g.condition,
        count: g._count.id,
      })),
    };
  }

  static async getAllocations(filters: ReportQueryFilters): Promise<AllocationReport> {
    const stats = await ReportRepository.getAllocationStats(filters);

    const getStatusCount = (status: string) => stats.statusGroups.find((g: any) => g.status === status)?._count.id || 0;

    return {
      totalAllocations: stats.total,
      activeAllocations: getStatusCount('ACTIVE'),
      overdueAllocations: getStatusCount('OVERDUE'),
      upcomingReturns: stats.upcomingReturns,
      departmentWise: stats.departmentWise,
    };
  }

  static async getMaintenance(filters: ReportQueryFilters): Promise<MaintenanceReport> {
    const stats = await ReportRepository.getMaintenanceStats(filters);

    const getStatusCount = (status: string) => stats.statusGroups.find((g: any) => g.status === status)?._count.id || 0;

    return {
      totalRequests: stats.total,
      pendingRequests: getStatusCount('PENDING'),
      inProgressRequests: getStatusCount('IN_PROGRESS') + getStatusCount('ASSIGNED'),
      resolvedRequests: getStatusCount('RESOLVED') + getStatusCount('CLOSED'),
      totalCost: stats.totalCost,
      priorityBreakdown: stats.priorityGroups.map((g: any) => ({
        priority: g.priority,
        count: g._count.id,
      })),
    };
  }

  static async getBookings(filters: ReportQueryFilters): Promise<BookingReport> {
    const stats = await ReportRepository.getBookingStats(filters);

    const getStatusCount = (status: string) => stats.statusGroups.find((g: any) => g.status === status)?._count.id || 0;
    const cancelled = getStatusCount('CANCELLED');
    const cancellationRate = stats.total > 0 ? (cancelled / stats.total) * 100 : 0;

    return {
      totalBookings: stats.total,
      upcomingBookings: getStatusCount('UPCOMING'),
      ongoingBookings: getStatusCount('ONGOING'),
      completedBookings: getStatusCount('COMPLETED'),
      cancelledBookings: cancelled,
      cancellationRate: parseFloat(cancellationRate.toFixed(2)),
      byResource: stats.resourceGroups,
    };
  }

  static async getAuditsMock(filters: ReportQueryFilters): Promise<AuditReportMock> {
    // Audit models are not yet implemented in DB. Providing mocked aggregated data for frontend integration.
    return {
      auditCycles: 4,
      verifiedAssets: 1250,
      missingAssets: 12,
      damagedAssets: 45,
      compliancePercentage: 98.5,
      discrepancyReports: 3,
    };
  }
}
