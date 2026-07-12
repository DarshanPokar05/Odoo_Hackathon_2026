import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import prisma from '../../../infrastructure/database/prisma';
import bcrypt from 'bcrypt';

jest.mock('../user.repository');
jest.mock('../../../infrastructure/database/prisma', () => ({
  activityLog: {
    create: jest.fn(),
  },
}));
jest.mock('bcrypt');

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if email already registered', async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValueOnce({ id: 'existing' });

      await expect(
        UserService.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password',
        }, 'admin-id')
      ).rejects.toThrow('Email is already registered');
    });

    it('should auto-generate employee code and create user', async () => {
      (UserRepository.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      (UserRepository.countByEmployeeCodePrefix as jest.Mock).mockResolvedValueOnce(0);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_pwd');
      (UserRepository.create as jest.Mock).mockResolvedValueOnce({ id: 'new-user', employeeCode: 'EMP-202607-0001' });

      const result = await UserService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password',
      }, 'admin-id');

      expect(UserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed_pwd',
          employeeCode: expect.stringContaining('EMP-'),
          status: 'ACTIVE',
        })
      );
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'USER_CREATED' })
        })
      );
      expect(result.id).toBe('new-user');
    });
  });

  describe('assignRole', () => {
    it('should assign role and generate activity log', async () => {
      (UserRepository.findById as jest.Mock).mockResolvedValueOnce({ id: 'user-id' });
      (UserRepository.assignRole as jest.Mock).mockResolvedValueOnce({ id: 'user-id', roleId: 'role-id' });

      const result = await UserService.assignRole('user-id', { roleId: 'role-id' }, 'admin-id');

      expect(UserRepository.assignRole).toHaveBeenCalledWith('user-id', 'role-id');
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'ROLE_ASSIGNED' })
        })
      );
      expect(result.roleId).toBe('role-id');
    });
  });
});
