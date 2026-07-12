import prisma from '../../infrastructure/database/prisma';
import { Prisma } from '@prisma/client';
import { ReportQueryFilters } from './report.dto';

export class ReportRepository {
  private static buildAssetWhere(filters: ReportQueryFilters): Prisma.AssetWhereInput {
    const where: Prisma.AssetWhereInput = { deletedAt: null };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.status) where.status = filters.status as any;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    return where;
  }

  static async getAssetStats(filters: ReportQueryFilters) {
    const where = this.buildAssetWhere(filters);

    const [total, statusGroups, conditionGroups, categoryGroups] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.asset.groupBy({
        by: ['condition'],
        where,
        _count: { id: true },
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
        where,
        _count: { id: true },
      }),
    ]);

    // To get category names without N+1, we fetch the categories we aggregated
    const categoryIds = categoryGroups.map((g: any) => g.categoryId);
    const categories = await prisma.assetCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));

    return {
      total,
      statusGroups,
      conditionGroups,
      categoryGroups: categoryGroups.map((g: any) => ({
        category: categoryMap.get(g.categoryId) || 'Unknown',
        count: g._count.id,
      })),
    };
  }

  static async getAllocationStats(filters: ReportQueryFilters) {
    const where: Prisma.AssetAllocationWhereInput = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, statusGroups, upcomingReturns] = await Promise.all([
      prisma.assetAllocation.count({ where }),
      prisma.assetAllocation.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.assetAllocation.count({
        where: {
          ...where,
          status: 'ACTIVE',
          expectedReturnDate: { not: null, gte: new Date() },
        },
      }),
    ]);

    // For department-wise allocations, we need to join through users
    const activeAllocations = await prisma.assetAllocation.findMany({
      where: { ...where, status: 'ACTIVE' },
      include: { userAllocatedTo: { include: { department: true } } },
    });

    const deptCount: Record<string, number> = {};
    activeAllocations.forEach((alloc: any) => {
      const deptName = alloc.userAllocatedTo.department?.name || 'Unassigned';
      deptCount[deptName] = (deptCount[deptName] || 0) + 1;
    });

    return {
      total,
      statusGroups,
      upcomingReturns,
      departmentWise: Object.entries(deptCount).map(([dept, count]) => ({ department: dept, count })),
    };
  }

  static async getMaintenanceStats(filters: ReportQueryFilters) {
    const where: Prisma.MaintenanceRequestWhereInput = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, statusGroups, priorityGroups, totalCostRaw] = await Promise.all([
      prisma.maintenanceRequest.count({ where }),
      prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.maintenanceRequest.groupBy({
        by: ['priority'],
        where,
        _count: { id: true },
      }),
      // We don't have a direct cost field on MaintenanceRequest in schema, but we can sum if it existed.
      // Mocking cost for now as it would normally require a MaintenanceCost table or field
      Promise.resolve(0), 
    ]);

    return { total, statusGroups, priorityGroups, totalCost: totalCostRaw };
  }

  static async getBookingStats(filters: ReportQueryFilters) {
    const where: Prisma.BookingWhereInput = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, statusGroups, resourceGroups] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.booking.groupBy({
        by: ['resourceId'],
        where,
        _count: { id: true },
      }),
    ]);

    const resourceIds = resourceGroups.map((g: any) => g.resourceId);
    const resources = await prisma.resource.findMany({
      where: { id: { in: resourceIds } },
      select: { id: true, name: true },
    });
    const resourceMap = new Map(resources.map((r: any) => [r.id, r.name]));

    return {
      total,
      statusGroups,
      resourceGroups: resourceGroups.map((g: any) => ({
        resourceName: resourceMap.get(g.resourceId) || 'Unknown',
        count: g._count.id,
      })),
    };
  }

  static async getRawAssetsForExport(filters: ReportQueryFilters) {
    const where = this.buildAssetWhere(filters);
    return prisma.asset.findMany({
      where,
      include: { category: true, creator: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
