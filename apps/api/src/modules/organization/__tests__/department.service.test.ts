import { DepartmentService } from '../services/department.service';
import { DepartmentRepository } from '../repositories/department.repository';
import prisma from '../../../infrastructure/database/prisma';

jest.mock('../repositories/department.repository');
jest.mock('../../../infrastructure/database/prisma', () => ({
  activityLog: {
    create: jest.fn(),
  },
}));

describe('DepartmentService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if department code already exists', async () => {
      (DepartmentRepository.findByCode as jest.Mock).mockResolvedValueOnce({ id: '123' });

      await expect(
        DepartmentService.create({ name: 'IT', code: 'IT-01' }, 'admin-id')
      ).rejects.toThrow('Department code must be unique');
    });

    it('should create department and activity log', async () => {
      (DepartmentRepository.findByCode as jest.Mock).mockResolvedValueOnce(null);
      (DepartmentRepository.create as jest.Mock).mockResolvedValueOnce({ id: 'dept-id', name: 'IT' });

      const result = await DepartmentService.create({ name: 'IT', code: 'IT-01' }, 'admin-id');

      expect(DepartmentRepository.create).toHaveBeenCalledWith({ name: 'IT', code: 'IT-01' });
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'DEPARTMENT_CREATED' })
        })
      );
      expect(result.id).toBe('dept-id');
    });
  });

  describe('deactivate', () => {
    it('should throw if department has active employees', async () => {
      (DepartmentRepository.findById as jest.Mock).mockResolvedValueOnce({ id: 'dept-id' });
      (DepartmentRepository.countActiveEmployees as jest.Mock).mockResolvedValueOnce(5);

      await expect(
        DepartmentService.deactivate('dept-id', 'admin-id')
      ).rejects.toThrow('Cannot delete department with active employees');
    });

    it('should soft delete if no active employees', async () => {
      (DepartmentRepository.findById as jest.Mock).mockResolvedValueOnce({ id: 'dept-id', name: 'IT' });
      (DepartmentRepository.countActiveEmployees as jest.Mock).mockResolvedValueOnce(0);
      (DepartmentRepository.softDelete as jest.Mock).mockResolvedValueOnce(true);

      const result = await DepartmentService.deactivate('dept-id', 'admin-id');

      expect(DepartmentRepository.softDelete).toHaveBeenCalledWith('dept-id');
      expect(result).toBe(true);
    });
  });
});
