import { AuthService } from './auth.service';
import prisma from '../../infrastructure/database/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../../infrastructure/database/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw an error if email is already registered', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: '1' });
      
      await expect(
        AuthService.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email is already registered');
    });

    it('should hash password and create a user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedPassword123');
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const result = await AuthService.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'USER_REGISTERED' })
        })
      );
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('login', () => {
    it('should throw if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        AuthService.login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should generate tokens on valid login', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        status: 'ACTIVE',
        roleId: 'role-id',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await AuthService.login({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'USER_LOGGED_IN' })
        })
      );
    });
  });
});
