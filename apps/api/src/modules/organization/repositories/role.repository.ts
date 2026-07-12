import prisma from '../../../infrastructure/database/prisma';
import { CreateRoleDTO, UpdateRoleDTO } from '../organization.dto';

export class RoleRepository {
  static async create(data: CreateRoleDTO) {
    const { permissionIds, ...roleData } = data;
    
    return prisma.role.create({
      data: {
        ...roleData,
        rolePermissions: {
          create: permissionIds?.map(permissionId => ({
            permission: { connect: { id: permissionId } }
          })) || []
        }
      },
      include: { rolePermissions: { include: { permission: true } } }
    });
  }

  static async update(id: string, data: UpdateRoleDTO) {
    const { permissionIds, ...roleData } = data;
    
    return prisma.$transaction(async (tx) => {
      // First update basic role details
      const _updatedRole = await tx.role.update({
        where: { id },
        data: roleData,
      });

      // If permissions are provided, sync them
      if (permissionIds !== undefined) {
        // Delete old permissions
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        
        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              roleId: id,
              permissionId
            }))
          });
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: { rolePermissions: { include: { permission: true } } }
      });
    });
  }

  static async delete(id: string) {
    return prisma.role.delete({ where: { id } });
  }

  static async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } }
    });
  }

  static async findByName(name: string) {
    return prisma.role.findUnique({ where: { name } });
  }

  static async findAll() {
    return prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } }
    });
  }
}
