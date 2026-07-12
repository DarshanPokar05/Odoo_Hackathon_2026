import { AllocationRepository } from './allocation.repository';
import { AllocateAssetDTO, ReturnAssetDTO, TransferRequestDTO } from './allocation.dto';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/customErrors';
import prisma from '../../infrastructure/database/prisma';
import { eventDispatcher } from '../../shared/events/eventDispatcher';
import { AppEvents } from '../../shared/events/eventConstants';

export class AllocationService {
  static async allocateAsset(data: AllocateAssetDTO, actionBy: string) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status !== 'AVAILABLE') throw new BusinessRuleError('Asset is not available for allocation');

    const user = await prisma.user.findUnique({ where: { id: data.allocatedTo } });
    if (!user) throw new NotFoundError('User not found');
    if (user.status !== 'ACTIVE') throw new BusinessRuleError('Cannot allocate to an inactive employee');

    const activeAllocation = await AllocationRepository.findActiveAllocation(data.assetId);
    if (activeAllocation) throw new BusinessRuleError('Asset is already allocated');

    const allocationData = {
      assetId: data.assetId,
      allocatedTo: data.allocatedTo,
      allocatedBy: actionBy,
      expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      remarks: data.remarks,
      conditionBefore: asset.condition,
    };

    const result = await AllocationRepository.executeAllocationTransaction(allocationData, data.assetId, actionBy);

    eventDispatcher.dispatch(AppEvents.ASSET_ASSIGNED, {
      userId: data.allocatedTo,
      assetName: asset.name,
      assetTag: asset.assetTag,
    });

    return result;
  }

  static async returnAsset(allocationId: string, data: ReturnAssetDTO, actionBy: string) {
    const allocation = await AllocationRepository.findById(allocationId);
    if (!allocation) throw new NotFoundError('Allocation not found');
    if (allocation.status !== 'ACTIVE') throw new BusinessRuleError('Allocation is not active');

    const result = await AllocationRepository.executeReturnTransaction(allocationId, allocation.assetId, data, actionBy);

    const asset = await prisma.asset.findUnique({ where: { id: allocation.assetId } });
    if (asset) {
      eventDispatcher.dispatch(AppEvents.ASSET_RETURNED, {
        userId: allocation.allocatedTo,
        assetName: asset.name,
        assetTag: asset.assetTag,
      });
    }

    return result;
  }

  static async getActiveAllocations() {
    return AllocationRepository.findAll();
  }

  static async getAllocationDetails(id: string) {
    const allocation = await AllocationRepository.findById(id);
    if (!allocation) throw new NotFoundError('Allocation not found');
    return allocation;
  }

  static async getOverdueAllocations() {
    return AllocationRepository.findOverdue();
  }

  static async requestTransfer(data: TransferRequestDTO, requestedBy: string) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status === 'DISPOSED' || asset.status === 'UNDER_MAINTENANCE') {
      throw new BusinessRuleError('Cannot transfer asset in current state');
    }

    return prisma.transferRequest.create({
      data: {
        assetId: data.assetId,
        requestedTo: data.requestedTo,
        requestedBy,
        reason: data.reason,
      },
    });
  }

  static async approveTransfer(transferId: string, actionBy: string) {
    const transfer = await prisma.transferRequest.findUnique({ where: { id: transferId } });
    if (!transfer) throw new NotFoundError('Transfer request not found');
    if (transfer.status !== 'PENDING') throw new BusinessRuleError('Transfer request is not pending');

    // Transfer Logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await prisma.$transaction(async (tx: any) => {
      // 1. Approve transfer
      await tx.transferRequest.update({
        where: { id: transferId },
        data: { status: 'APPROVED', assetManagerApproval: true },
      });

      // 2. Close active allocation if exists
      const activeAllocation = await tx.assetAllocation.findFirst({
        where: { assetId: transfer.assetId, status: 'ACTIVE' },
      });

      if (activeAllocation) {
        await tx.assetAllocation.update({
          where: { id: activeAllocation.id },
          data: { status: 'TRANSFERRED', actualReturnDate: new Date() },
        });
      }

      // 3. Create New Allocation
      const asset = await tx.asset.findUnique({ where: { id: transfer.assetId } });
      const newAllocation = await tx.assetAllocation.create({
        data: {
          assetId: transfer.assetId,
          allocatedTo: transfer.requestedTo,
          allocatedBy: actionBy,
          conditionBefore: asset?.condition || 'GOOD',
          status: 'ACTIVE',
          remarks: `Transferred from Request ${transferId}`,
        },
      });

      // 4. Update Asset
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: { status: 'ALLOCATED' },
      });

      return newAllocation;
    });
  }

  static async rejectTransfer(transferId: string) {
    const transfer = await prisma.transferRequest.findUnique({ where: { id: transferId } });
    if (!transfer) throw new NotFoundError('Transfer request not found');
    if (transfer.status !== 'PENDING') throw new BusinessRuleError('Transfer request is not pending');

    return prisma.transferRequest.update({
      where: { id: transferId },
      data: { status: 'REJECTED' },
    });
  }
}
