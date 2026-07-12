import prisma from '../../infrastructure/database/prisma';
import { Prisma } from '@prisma/client';
import { ActivityLogQueryFilters, ActivityLogResponse } from './activity.dto';

export class ActivityRepository {
  private static buildWhereInput(filters: ActivityLogQueryFilters): Prisma.ActivityLogWhereInput {
    const where: Prisma.ActivityLogWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.role) where.role = filters.role;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return where;
  }

  static async findManyWithCursor(filters: ActivityLogQueryFilters): Promise<ActivityLogResponse> {
    const limit = filters.limit || 20;
    const where = this.buildWhereInput(filters);

    const logs = await prisma.activityLog.findMany({
      where,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasNextPage = false;

    if (logs.length > limit) {
      hasNextPage = true;
      const nextItem = logs.pop();
      nextCursor = nextItem?.id || null;
    }

    return {
      data: logs,
      meta: {
        nextCursor,
        hasNextPage,
      },
    };
  }

  static async findById(id: string) {
    return prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
      },
    });
  }

  static async findForExport(filters: ActivityLogQueryFilters) {
    const where = this.buildWhereInput(filters);

    // Using streaming approach for exports in the service, but we'll fetch chunks or large array if manageable
    // For extreme datasets, Prisma cursor chunking would be implemented here, but for now we'll rely on findMany
    return prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
