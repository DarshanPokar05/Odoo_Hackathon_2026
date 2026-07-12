import prisma from '../../infrastructure/database/prisma';
import { Prisma } from '@prisma/client';

export class AssetRepository {
  static async create(data: Prisma.AssetUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return await db.asset.create({
      data,
    });
  }

  static async findById(id: string) {
    return await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        images: true,
        documents: true,
      },
    });
  }

  static async findByTag(assetTag: string) {
    return await prisma.asset.findFirst({
      where: { assetTag, deletedAt: null },
    });
  }

  static async update(id: string, data: Prisma.AssetUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return await db.asset.update({
      where: { id },
      data,
    });
  }

  static async softDelete(id: string, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return await db.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AssetWhereInput;
    orderBy?: Prisma.AssetOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return await prisma.asset.findMany({
      skip,
      take,
      where: { ...where, deletedAt: null },
      orderBy,
      include: {
        category: true,
      },
    });
  }

  static async count(where?: Prisma.AssetWhereInput) {
    return await prisma.asset.count({
      where: { ...where, deletedAt: null },
    });
  }

  static async createHistory(data: Prisma.AssetHistoryUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return await db.assetHistory.create({
      data,
    });
  }

  static async getTimeline(assetId: string) {
    return await prisma.assetHistory.findMany({
      where: { assetId },
      orderBy: { performedAt: 'desc' },
      include: {
        performer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  static async createActivityLog(data: Prisma.ActivityLogUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return await db.activityLog.create({
      data,
    });
  }
}
