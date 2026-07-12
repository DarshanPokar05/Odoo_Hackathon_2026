import prisma from '../../infrastructure/database/prisma';
import { CreateUserDTO, UpdateUserDTO, UserQueryFilters, UpdateProfileDTO } from './user.dto';
import { Prisma } from '@prisma/client';

export class UserRepository {
  static async create(data: CreateUserDTO & { password: string; employeeCode: string; status: 'ACTIVE' }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
        roleId: true,
        status: true,
      },
    });
  }

  static async update(id: string, data: UpdateUserDTO) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
        roleId: true,
        status: true,
      },
    });
  }

  static async updateProfile(id: string, data: UpdateProfileDTO) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
      },
    });
  }

  static async assignRole(id: string, roleId: string) {
    return prisma.user.update({
      where: { id },
      data: { roleId },
      select: { id: true, email: true, roleId: true, role: true },
    });
  }

  static async changeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, status: true },
    });
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { department: true, role: true },
    });
  }

  static async findByIdWithPassword(id: string) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  static async findAll(filters: UserQueryFilters) {
    const whereClause: Prisma.UserWhereInput = { deletedAt: null };

    if (filters.departmentId) whereClause.departmentId = filters.departmentId;
    if (filters.roleId) whereClause.roleId = filters.roleId;
    if (filters.status) whereClause.status = filters.status;
    if (filters.search) {
      whereClause.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where: whereClause,
      include: { department: true, role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async countByEmployeeCodePrefix(prefix: string) {
    return prisma.user.count({
      where: { employeeCode: { startsWith: prefix } },
    });
  }
}
