import { PermissionRepository } from '../repositories/permission.repository';
import { CreatePermissionDTO, UpdatePermissionDTO } from '../organization.dto';
import { BusinessRuleError, NotFoundError } from '../../../shared/errors/customErrors';
import prisma from '../../../infrastructure/database/prisma';

export class PermissionService {
  static async create(data: CreatePermissionDTO, userId: string) {
    const existing = await PermissionRepository.findByActionAndResource(data.action, data.resource);
    if (existing) {
      throw new BusinessRuleError('Permission with this action and resource already exists');
    }

    const permission = await PermissionRepository.create(data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PERMISSION_CREATED',
        entityId: permission.id,
        entityType: 'PERMISSION',
      }
    });

    return permission;
  }

  static async update(id: string, data: UpdatePermissionDTO, userId: string) {
    const permission = await PermissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    const newAction = data.action ?? permission.action;
    const newResource = data.resource ?? permission.resource;

    if (newAction !== permission.action || newResource !== permission.resource) {
      const existing = await PermissionRepository.findByActionAndResource(newAction, newResource);
      if (existing) {
        throw new BusinessRuleError('Permission with this action and resource already exists');
      }
    }

    const updatedPermission = await PermissionRepository.update(id, data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PERMISSION_UPDATED',
        entityId: permission.id,
        entityType: 'PERMISSION',
      }
    });

    return updatedPermission;
  }

  static async delete(id: string, userId: string) {
    const permission = await PermissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    await PermissionRepository.delete(id);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PERMISSION_DELETED',
        entityId: permission.id,
        entityType: 'PERMISSION',
      }
    });

    return true;
  }

  static async getById(id: string) {
    const permission = await PermissionRepository.findById(id);
    if (!permission) throw new NotFoundError('Permission not found');
    return permission;
  }

  static async getAll() {
    return PermissionRepository.findAll();
  }
}
