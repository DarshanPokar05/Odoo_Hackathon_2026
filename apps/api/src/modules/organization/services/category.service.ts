import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../organization.dto';
import { BusinessRuleError, NotFoundError } from '../../../shared/errors/customErrors';
import prisma from '../../../infrastructure/database/prisma';

export class CategoryService {
  static async create(data: CreateCategoryDTO, userId: string) {
    const existingCode = await CategoryRepository.findByCode(data.code);
    if (existingCode) {
      throw new BusinessRuleError('Category code must be unique');
    }

    const existingName = await CategoryRepository.findByName(data.name);
    if (existingName) {
      throw new BusinessRuleError('Category name must be unique');
    }

    const category = await CategoryRepository.create(data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CATEGORY_CREATED',
        entityId: category.id,
        entityType: 'ASSET_CATEGORY',
      }
    });

    return category;
  }

  static async update(id: string, data: UpdateCategoryDTO, userId: string) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (data.code && data.code !== category.code) {
      const existingCode = await CategoryRepository.findByCode(data.code);
      if (existingCode) {
        throw new BusinessRuleError('Category code must be unique');
      }
    }

    const updatedCategory = await CategoryRepository.update(id, data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CATEGORY_UPDATED',
        entityId: category.id,
        entityType: 'ASSET_CATEGORY',
      }
    });

    return updatedCategory;
  }

  static async deactivate(id: string, userId: string) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await CategoryRepository.softDelete(id);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CATEGORY_DEACTIVATED',
        entityId: category.id,
        entityType: 'ASSET_CATEGORY',
      }
    });

    return true;
  }

  static async getById(id: string) {
    const category = await CategoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async getAll() {
    return CategoryRepository.findAll();
  }
}
