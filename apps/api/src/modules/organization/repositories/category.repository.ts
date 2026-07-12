import prisma from '../../../infrastructure/database/prisma';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../organization.dto';

export class CategoryRepository {
  static async create(data: CreateCategoryDTO) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prisma.assetCategory.create({ data: { ...data, metadata: data.metadata ? (data.metadata as any) : null } });
  }

  static async update(id: string, data: UpdateCategoryDTO) {
    return prisma.assetCategory.update({ 
      where: { id }, 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...data, metadata: data.metadata !== undefined ? (data.metadata as any) : undefined } 
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
