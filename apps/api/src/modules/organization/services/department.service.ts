import { DepartmentRepository } from '../repositories/department.repository';
import { CreateDepartmentDTO, UpdateDepartmentDTO } from '../organization.dto';
import { BusinessRuleError, NotFoundError } from '../../../shared/errors/customErrors';
import prisma from '../../../infrastructure/database/prisma';

export class DepartmentService {
  static async create(data: CreateDepartmentDTO, userId: string) {
    const existingCode = await DepartmentRepository.findByCode(data.code);
    if (existingCode) {
      throw new BusinessRuleError('Department code must be unique');
    }

    const department = await DepartmentRepository.create(data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DEPARTMENT_CREATED',
        entityId: department.id,
        entityType: 'DEPARTMENT',
      }
    });

    console.log(`[Notification Mock] Department Created: ${department.name}`);

    return department;
  }

  static async update(id: string, data: UpdateDepartmentDTO, userId: string) {
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    if (data.code && data.code !== department.code) {
      const existingCode = await DepartmentRepository.findByCode(data.code);
      if (existingCode) {
        throw new BusinessRuleError('Department code must be unique');
      }
    }

    const updatedDepartment = await DepartmentRepository.update(id, data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DEPARTMENT_UPDATED',
        entityId: department.id,
        entityType: 'DEPARTMENT',
      }
    });

    if (data.headId && data.headId !== department.headId) {
      console.log(`[Notification Mock] Department Head Assigned: ${updatedDepartment.name}`);
    }

    if (data.status === 'INACTIVE' && department.status !== 'INACTIVE') {
      console.log(`[Notification Mock] Department Deactivated: ${updatedDepartment.name}`);
    } else if (data.status === 'ACTIVE' && department.status !== 'ACTIVE') {
      console.log(`[Notification Mock] Department Activated: ${updatedDepartment.name}`);
    }

    return updatedDepartment;
  }

  static async deactivate(id: string, userId: string) {
    const department = await DepartmentRepository.findById(id);
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    const activeEmployeesCount = await DepartmentRepository.countActiveEmployees(id);
    if (activeEmployeesCount > 0) {
      throw new BusinessRuleError('Cannot delete department with active employees');
    }

    // Checking active assets and audits would normally happen here by querying other modules.
    // For now, we enforce the soft delete via the repository.
    
    await DepartmentRepository.softDelete(id);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DEPARTMENT_DEACTIVATED',
        entityId: department.id,
        entityType: 'DEPARTMENT',
      }
    });

    console.log(`[Notification Mock] Department Deactivated: ${department.name}`);

    return true;
  }

  static async getById(id: string) {
    const department = await DepartmentRepository.findById(id);
    if (!department) throw new NotFoundError('Department not found');
    return department;
  }

  static async getAll() {
    return DepartmentRepository.findAll();
  }
}
