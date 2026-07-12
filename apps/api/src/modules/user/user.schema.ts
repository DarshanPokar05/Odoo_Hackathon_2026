import { z } from 'zod';

export const CreateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    phone: z.string().optional(),
    departmentId: z.string().uuid('Invalid department ID').optional(),
  }),
});

export const UpdateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional().nullable(),
    departmentId: z.string().uuid().optional().nullable(),
  }),
});

export const AssignRoleSchema = z.object({
  body: z.object({
    roleId: z.string().uuid('Invalid role ID'),
  }),
});

export const UpdateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional().nullable(),
    profileImage: z.string().url().optional().nullable(),
  }),
});

export const ChangePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
});
