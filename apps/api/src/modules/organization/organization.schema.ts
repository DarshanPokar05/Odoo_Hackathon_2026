import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    code: z.string().min(1, 'Department code is required'),
    parentDepartmentId: z.string().uuid('Invalid parent department ID').optional(),
    headId: z.string().uuid('Invalid head ID').optional(),
  }),
});

export const UpdateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    parentDepartmentId: z.string().uuid().optional().nullable(),
    headId: z.string().uuid().optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    code: z.string().min(1, 'Category code is required'),
    description: z.string().optional(),
    metadata: z.record(z.any()).optional(), // Validates JSON object
  }),
});

export const UpdateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const CreateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional(),
    permissionIds: z.array(z.string().uuid()).optional(),
  }),
});

export const UpdateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    permissionIds: z.array(z.string().uuid()).optional(),
  }),
});

export const CreatePermissionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Permission name is required'),
    description: z.string().optional(),
  }),
});

export const UpdatePermissionSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
  }),
});
