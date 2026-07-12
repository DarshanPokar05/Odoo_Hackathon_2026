import prisma from '../../../infrastructure/database/prisma';
import { CreatePermissionDTO, UpdatePermissionDTO } from '../organization.dto';

export class PermissionRepository {
  static async create(data: CreatePermissionDTO) {
    return prisma.permission.create({ data });
  }

  static async update(id: string, data: UpdatePermissionDTO) {
    return prisma.permission.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.permission.delete({ where: { id } });
  }

  static async findById(id: string) {
    return prisma.permission.findUnique({ where: { id } });
  }

  static async findByName(name: string) {
    return prisma.permission.findUnique({ where: { name } });
  }

  static async findAll() {
    return prisma.permission.findMany();
  }
}
