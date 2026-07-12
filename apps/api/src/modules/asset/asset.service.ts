import { Prisma } from '@prisma/client';
import { AssetRepository } from './asset.repository';
import { CreateAssetDTO, UpdateAssetDTO } from './asset.dto';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/customErrors';
import prisma from '../../infrastructure/database/prisma';

export class AssetService {
  static async registerAsset(data: CreateAssetDTO, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // Generate Asset Tag
      const count = await AssetRepository.count();
      const assetTag = `AST-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Create Asset
      const asset = await AssetRepository.create(
        {
          ...data,
          assetTag,
          createdBy: userId,
          status: 'AVAILABLE',
        },
        tx
      );

      // Activity Log
      await AssetRepository.createActivityLog(
        {
          action: 'REGISTER_ASSET',
          entityId: asset.id,
          entityType: 'Asset',
          userId,
          newValues: JSON.stringify(asset),
        },
        tx
      );

      // Asset History
      await AssetRepository.createHistory(
        {
          assetId: asset.id,
          action: 'CREATED',
          performedBy: userId,
          remarks: 'Asset registered in the system',
        },
        tx
      );

      return asset;
    });
  }

  static async updateAsset(id: string, data: UpdateAssetDTO, userId: string) {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (asset.status === 'DISPOSED') {
      throw new BusinessRuleError('Cannot edit a disposed asset', 'ASSET_DISPOSED');
    }

    return await prisma.$transaction(async (tx) => {
      const updatedAsset = await AssetRepository.update(id, data, tx);

      await AssetRepository.createActivityLog(
        {
          action: 'UPDATE_ASSET',
          entityId: asset.id,
          entityType: 'Asset',
          userId,
          oldValues: JSON.stringify(asset),
          newValues: JSON.stringify(updatedAsset),
        },
        tx
      );

      await AssetRepository.createHistory(
        {
          assetId: asset.id,
          action: 'UPDATED',
          performedBy: userId,
          remarks: 'Asset details updated',
        },
        tx
      );

      return updatedAsset;
    });
  }

  static async getAssetDetails(id: string) {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }
    return asset;
  }

  static async getAssets(skip: number = 0, take: number = 20, search?: string) {
    const where: Prisma.AssetWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    const assets = await AssetRepository.findMany({ skip, take, where, orderBy: { createdAt: 'desc' } });
    const total = await AssetRepository.count(where);
    return { assets, total };
  }

  static async deleteAsset(id: string, userId: string) {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (['ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE'].includes(asset.status)) {
      throw new BusinessRuleError('Cannot delete asset while in active use', 'ASSET_IN_USE');
    }

    return await prisma.$transaction(async (tx) => {
      await AssetRepository.softDelete(id, tx);

      await AssetRepository.createActivityLog(
        {
          action: 'DELETE_ASSET',
          entityId: asset.id,
          entityType: 'Asset',
          userId,
        },
        tx
      );

      await AssetRepository.createHistory(
        {
          assetId: asset.id,
          action: 'DELETED',
          performedBy: userId,
          remarks: 'Asset soft deleted',
        },
        tx
      );
    });
  }

  static async getAssetTimeline(id: string) {
    const asset = await AssetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }
    return await AssetRepository.getTimeline(id);
  }
}
