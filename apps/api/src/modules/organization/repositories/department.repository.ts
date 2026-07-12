import prisma from '../../../infrastructure/database/prisma';
import { CreateDepartmentDTO, UpdateDepartmentDTO } from '../organization.dto';

export class DepartmentRepository {
  static async create(data: CreateDepartmentDTO) {
    return prisma.department.create({ data });
  }

  static async update(id: string, data: UpdateDepartmentDTO) {
    return prisma.department.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    return prisma.department.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  static async findById(id: string) {
    return prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: { parentDepartment: true },
    });
  }

  static async findByCode(code: string) {
    return prisma.department.findFirst({ where: { code, deletedAt: null } });
  }

  static async findByName(name: string) {
    return prisma.department.findFirst({ where: { name, deletedAt: null } });
  }

  static async findAll() {
    return prisma.department.findMany({
      where: { deletedAt: null },
      include: { parentDepartment: true },
    });
  }

  static async countActiveEmployees(departmentId: string) {
    return prisma.user.count({
      where: { departmentId, status: 'ACTIVE', deletedAt: null },
    });
  }
}
