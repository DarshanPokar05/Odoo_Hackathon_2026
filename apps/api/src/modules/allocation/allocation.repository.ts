import prisma from '../../infrastructure/database/prisma';
import { Prisma, AllocationStatus, Condition } from '@prisma/client';
import { ReturnAssetDTO } from './allocation.dto';

export class AllocationRepository {
  static async findActiveAllocation(assetId: string) {
    return prisma.assetAllocation.findFirst({
      where: {
        assetId,
        status: AllocationStatus.ACTIVE,
      },
    });
  }

  static async findAll() {
    return prisma.assetAllocation.findMany({
      include: {
        asset: true,
        userAllocatedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findById(id: string) {
    return prisma.assetAllocation.findUnique({
      where: { id },
      include: {
        asset: true,
        userAllocatedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  static async findOverdue() {
    return prisma.assetAllocation.findMany({
      where: {
        status: AllocationStatus.ACTIVE,
        expectedReturnDate: {
          lt: new Date(),
        },
      },
      include: {
        asset: true,
        userAllocatedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
  
  static async markOverdue(tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return db.assetAllocation.updateMany({
      where: {
        status: AllocationStatus.ACTIVE,
        expectedReturnDate: {
          lt: new Date(),
        },
      },
      data: {
        status: AllocationStatus.OVERDUE,
      },
    });
  }

  static async executeAllocationTransaction(
    allocationData: Omit<Prisma.AssetAllocationUncheckedCreateInput, 'id' | 'status' | 'conditionBefore' | 'allocationDate' | 'createdAt'> & { conditionBefore: Condition },
    assetId: string,
    actionBy: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Allocation
      const allocation = await tx.assetAllocation.create({
        data: {
          ...allocationData,
          status: AllocationStatus.ACTIVE,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'ALLOCATED' },
      });

      // 3. Create Asset History
      await tx.assetHistory.create({
        data: {
          assetId,
          action: 'ALLOCATE',
          previousValue: 'AVAILABLE',
          newValue: 'ALLOCATED',
          performedBy: actionBy,
          remarks: allocationData.remarks,
        },
      });

      // 4. Create Activity Log
      await tx.activityLog.create({
        data: {
          userId: actionBy,
          action: 'ALLOCATED_ASSET',
          entityId: allocation.id,
          entityType: 'ASSET_ALLOCATION',
          newValues: JSON.stringify(allocation),
        },
      });

      return allocation;
    });
  }

  static async executeReturnTransaction(
    allocationId: string,
    assetId: string,
    data: ReturnAssetDTO,
    actionBy: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Update Allocation Status
      const allocation = await tx.assetAllocation.update({
        where: { id: allocationId },
        data: {
          status: AllocationStatus.RETURNED,
          actualReturnDate: new Date(),
          conditionAfter: data.conditionAfter,
          remarks: data.remarks,
        },
      });

      // 2. Determine next asset status based on condition
      const assetStatus = data.conditionAfter === 'BROKEN' ? 'UNDER_MAINTENANCE' : 'AVAILABLE';

      await tx.asset.update({
        where: { id: assetId },
        data: { 
          status: assetStatus,
          condition: data.conditionAfter,
        },
      });

      // 4. Create Asset History
      await tx.assetHistory.create({
        data: {
          assetId,
          action: 'RETURN',
          previousValue: 'ALLOCATED',
          newValue: assetStatus,
          performedBy: actionBy,
          remarks: data.remarks,
        },
      });

      // 5. Create Activity Log
      await tx.activityLog.create({
        data: {
          userId: actionBy,
          action: 'RETURNED_ASSET',
          entityId: allocation.id,
          entityType: 'ASSET_ALLOCATION',
          newValues: JSON.stringify(allocation),
        },
      });

      return allocation;
    });
  }
}
