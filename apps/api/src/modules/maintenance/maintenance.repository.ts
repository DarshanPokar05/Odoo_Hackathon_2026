import prisma from '../../infrastructure/database/prisma';
import { MaintenanceRequest, MaintenanceStatus, Prisma, AssetStatus } from '@prisma/client';

export class MaintenanceRepository {
  async createMaintenanceRequest(
    data: Prisma.MaintenanceRequestUncheckedCreateInput,
    userId: string
  ): Promise<MaintenanceRequest> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prisma.$transaction(async (tx: any) => {
      const request = await tx.maintenanceRequest.create({
        data,
      });

      await tx.maintenanceHistory.create({
        data: {
          maintenanceRequestId: request.id,
          status: request.status,
          remarks: 'Request raised',
          updatedBy: userId,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: 'RAISE_MAINTENANCE_REQUEST',
          entityId: request.id,
          entityType: 'MaintenanceRequest',
          newValues: JSON.stringify(request),
        },
      });

      return request;
    });
  }

  async getMaintenanceRequestById(id: string) {
    return prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        userReportedBy: true,
        userAssignedTo: true,
        history: {
          orderBy: { createdAt: 'desc' },
          include: { userUpdatedBy: true },
        },
      },
    });
  }

  async listMaintenanceRequests(filters: { status?: MaintenanceStatus, assetId?: string } = {}) {
    return prisma.maintenanceRequest.findMany({
      where: filters,
      include: {
        asset: true,
        userReportedBy: true,
        userAssignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMaintenanceStatus(
    id: string,
    status: MaintenanceStatus,
    assetStatus: AssetStatus | null,
    userId: string,
    remarks?: string,
    additionalData: Partial<Prisma.MaintenanceRequestUpdateInput> = {}
  ): Promise<MaintenanceRequest> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prisma.$transaction(async (tx: any) => {
      const currentRequest = await tx.maintenanceRequest.findUniqueOrThrow({
        where: { id },
      });

      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status,
          ...additionalData,
        },
      });

      await tx.maintenanceHistory.create({
        data: {
          maintenanceRequestId: id,
          status,
          remarks,
          updatedBy: userId,
        },
      });

      if (assetStatus) {
        await tx.asset.update({
          where: { id: updatedRequest.assetId },
          data: { status: assetStatus },
        });

        await tx.assetHistory.create({
          data: {
            assetId: updatedRequest.assetId,
            action: `ASSET_STATUS_${assetStatus}`,
            previousValue: JSON.stringify({ status: currentRequest.status }),
            newValue: JSON.stringify({ status: assetStatus }),
            performedBy: userId,
            remarks: `Status updated by Maintenance Request ${id}`,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId,
          action: `UPDATE_MAINTENANCE_${status}`,
          entityId: id,
          entityType: 'MaintenanceRequest',
          oldValues: JSON.stringify({ status: currentRequest.status }),
          newValues: JSON.stringify({ status }),
        },
      });

      return updatedRequest;
    });
  }
}
