import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../../infrastructure/database/prisma';
import { RegisterDTO, LoginDTO, ResetPasswordDTO } from './auth.dto';
import { AuthenticationError, BusinessRuleError } from '../../shared/errors/customErrors';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key';

export class AuthService {
  static async register(data: RegisterDTO) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BusinessRuleError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: hashedPassword,
          departmentId: data.departmentId,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entityId: user.id,
          entityType: 'USER',
        },
      });

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      };
    });
  }

  static async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new AuthenticationError('Account is inactive');
    }

    const accessToken = jwt.sign({ id: user.id, role: user.roleId }, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGGED_IN',
          entityId: user.id,
          entityType: 'USER',
        },
      });
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleId: user.roleId,
      },
    };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload & { id: string };
      
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || user.status !== 'ACTIVE') {
        throw new AuthenticationError('User not found or inactive');
      }

      const accessToken = jwt.sign({ id: user.id, role: user.roleId }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      });

      const newRefreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  static async logout(userId: string) {
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'USER_LOGGED_OUT',
        entityId: userId,
        entityType: 'USER',
      },
    });
    return true;
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to avoid email enumeration
      return true;
    }

    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityId: user.id,
        entityType: 'USER',
      },
    });

    // In a real application, send this token via email
    console.log(`Password reset token for ${email}: ${resetToken}`);
    return true;
  }

  static async resetPassword(data: ResetPasswordDTO) {
    try {
      const decoded = jwt.verify(data.token, JWT_SECRET) as JwtPayload & { id: string };
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: decoded.id },
          data: { password: hashedPassword },
        });

        await tx.activityLog.create({
          data: {
            userId: decoded.id,
            action: 'PASSWORD_RESET_COMPLETED',
            entityId: decoded.id,
            entityType: 'USER',
          },
        });
      });

      return true;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired reset token');
    }
  }
}
