import prisma from '../../../infrastructure/database/prisma';
import { CreatePermissionDTO, UpdatePermissionDTO } from '../organization.dto';

export class PermissionRepository {
  static async create(data: CreatePermissionDTO) {
    const [action, resource = 'all'] = data.name.split(':');
    return prisma.permission.create({ data: { action, resource, description: data.description } });
  }

  static async update(id: string, data: UpdatePermissionDTO) {
    const updateData: Record<string, string> = { description: data.description! };
    if (data.name) {
      const [action, resource = 'all'] = data.name.split(':');
      updateData.action = action;
      updateData.resource = resource;
    }
    return prisma.permission.update({ where: { id }, data: updateData });
  }

  static async delete(id: string) {
    return prisma.permission.delete({ where: { id } });
  }

  static async findById(id: string) {
    return prisma.permission.findUnique({ where: { id } });
  }

  static async findByActionAndResource(action: string, resource: string) {
    return prisma.permission.findUnique({
      where: {
        action_resource: { action, resource }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async assignPermissions(roleId: string, permissionIds: string[], tx?: any) {
    const client = tx || prisma;
    return client.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    });
  }

  static async findByName(name: string) {
    const [action, resource = 'all'] = name.split(':');
    return prisma.permission.findFirst({ where: { action, resource } }); // Fallback or split if necessary
  }

  static async findAll() {
    return prisma.permission.findMany();
  }
}
