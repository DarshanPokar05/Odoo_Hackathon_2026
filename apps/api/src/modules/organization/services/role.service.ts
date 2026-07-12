import { RoleRepository } from '../repositories/role.repository';
import { CreateRoleDTO, UpdateRoleDTO } from '../organization.dto';
import { BusinessRuleError, NotFoundError } from '../../../shared/errors/customErrors';
import prisma from '../../../infrastructure/database/prisma';

export class RoleService {
  static async create(data: CreateRoleDTO, userId: string) {
    const existingName = await RoleRepository.findByName(data.name);
    if (existingName) {
      throw new BusinessRuleError('Role name must be unique');
    }

    const role = await RoleRepository.create(data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ROLE_CREATED',
        entityId: role.id,
        entityType: 'ROLE',
      }
    });

    return role;
  }

  static async update(id: string, data: UpdateRoleDTO, userId: string) {
    const role = await RoleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (data.name && data.name !== role.name) {
      const existingName = await RoleRepository.findByName(data.name);
      if (existingName) {
        throw new BusinessRuleError('Role name must be unique');
      }
    }

    const updatedRole = await RoleRepository.update(id, data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ROLE_UPDATED',
        entityId: role.id,
        entityType: 'ROLE',
      }
    });

    console.log(`[Notification Mock] Role Changes applied to: ${updatedRole?.name}`);

    return updatedRole;
  }

  static async delete(id: string, userId: string) {
    const role = await RoleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    await RoleRepository.delete(id);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'ROLE_DELETED',
        entityId: role.id,
        entityType: 'ROLE',
      }
    });

    return true;
  }

  static async getById(id: string) {
    const role = await RoleRepository.findById(id);
    if (!role) throw new NotFoundError('Role not found');
    return role;
  }

  static async getAll() {
    return RoleRepository.findAll();
  }
}
