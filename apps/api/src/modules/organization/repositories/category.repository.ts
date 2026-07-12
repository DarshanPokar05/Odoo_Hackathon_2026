import prisma from '../../../infrastructure/database/prisma';
import { Prisma } from '@prisma/client';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../organization.dto';

export class CategoryRepository {
  static async create(data: CreateCategoryDTO) {
    // Cast metadata to Prisma's JSON-compatible type
    return prisma.assetCategory.create({ data: { ...data, metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : (null as any) } });
  }

  static async update(id: string, data: UpdateCategoryDTO) {
    return prisma.assetCategory.update({ 
      where: { id }, 
      data: { ...data, metadata: data.metadata !== undefined ? (data.metadata as Prisma.InputJsonValue) : undefined } 
    });
  }

  static async softDelete(id: string) {
    return prisma.assetCategory.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  static async findById(id: string) {
    return prisma.assetCategory.findFirst({ where: { id, deletedAt: null } });
  }

  static async findByCode(code: string) {
    return prisma.assetCategory.findFirst({ where: { code, deletedAt: null } });
  }

  static async findByName(name: string) {
    return prisma.assetCategory.findFirst({ where: { name, deletedAt: null } });
  }

  static async findAll() {
    return prisma.assetCategory.findMany({ where: { deletedAt: null } });
  }
}
