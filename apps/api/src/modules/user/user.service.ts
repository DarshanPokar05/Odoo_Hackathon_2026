import { UserRepository } from './user.repository';
import { CreateUserDTO, UpdateUserDTO, UserQueryFilters, AssignRoleDTO, UpdateProfileDTO, ChangePasswordDTO } from './user.dto';
import { BusinessRuleError, NotFoundError } from '../../shared/errors/customErrors';
import prisma from '../../infrastructure/database/prisma';
import bcrypt from 'bcrypt';

export class UserService {
  private static async generateEmployeeCode(): Promise<string> {
    const date = new Date();
    const prefix = `EMP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await UserRepository.countByEmployeeCodePrefix(prefix);
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${sequence}`;
  }

  static async create(data: CreateUserDTO, adminId: string) {
    const existingUser = await UserRepository.findByEmail(data.email);
    if (existingUser) {
      throw new BusinessRuleError('Email is already registered');
    }

    const employeeCode = await this.generateEmployeeCode();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await UserRepository.create({
      ...data,
      password: hashedPassword,
      employeeCode,
      status: 'ACTIVE',
    });

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'USER_CREATED',
        entityId: user.id,
        entityType: 'USER',
      },
    });

    return user;
  }

  static async update(id: string, data: UpdateUserDTO, adminId: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    const updatedUser = await UserRepository.update(id, data);

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'USER_UPDATED',
        entityId: user.id,
        entityType: 'USER',
      },
    });

    return updatedUser;
  }

  static async assignRole(id: string, data: AssignRoleDTO, adminId: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    // Role existence validation would be handled via Prisma relation constraints
    const updatedUser = await UserRepository.assignRole(id, data.roleId);

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'ROLE_ASSIGNED',
        entityId: user.id,
        entityType: 'USER',
        newValues: JSON.stringify({ roleId: data.roleId }),
      },
    });

    console.log(`[Notification Mock] Role Assigned to ${user.email}: ${data.roleId}`);

    return updatedUser;
  }

  static async activate(id: string, adminId: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    if (user.status === 'ACTIVE') return user;

    const activatedUser = await UserRepository.changeStatus(id, 'ACTIVE');

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'USER_UPDATED',
        entityId: user.id,
        entityType: 'USER',
        newValues: JSON.stringify({ status: 'ACTIVE' }),
      },
    });

    console.log(`[Notification Mock] Account Activated: ${user.email}`);

    return activatedUser;
  }

  static async deactivate(id: string, adminId: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');

    if (user.status === 'INACTIVE') return user;

    const deactivatedUser = await UserRepository.changeStatus(id, 'INACTIVE');

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'USER_DEACTIVATED',
        entityId: user.id,
        entityType: 'USER',
        newValues: JSON.stringify({ status: 'INACTIVE' }),
      },
    });

    console.log(`[Notification Mock] Account Deactivated: ${user.email}`);

    return deactivatedUser;
  }

  static async getById(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  static async getAll(filters: UserQueryFilters) {
    return UserRepository.findAll(filters);
  }

  // Profile Management (Self)
  static async updateProfile(id: string, data: UpdateProfileDTO) {
    const updatedProfile = await UserRepository.updateProfile(id, data);

    await prisma.activityLog.create({
      data: {
        userId: id,
        action: 'PROFILE_UPDATED',
        entityId: id,
        entityType: 'USER',
      },
    });

    return updatedProfile;
  }

  static async changePassword(id: string, data: ChangePasswordDTO) {
    const user = await UserRepository.findByIdWithPassword(id);
    if (!user) throw new NotFoundError('User not found');

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new BusinessRuleError('Invalid current password');

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });

    await prisma.activityLog.create({
      data: {
        userId: id,
        action: 'PASSWORD_CHANGED',
        entityId: id,
        entityType: 'USER',
      },
    });

    console.log(`[Notification Mock] Password Changed for user: ${id}`);

    return true;
  }
}
