import { z } from 'zod';
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateRoleSchema,
  UpdateRoleSchema,
  CreatePermissionSchema,
  UpdatePermissionSchema,
} from './organization.schema';

export type CreateDepartmentDTO = z.infer<typeof CreateDepartmentSchema>['body'];
export type UpdateDepartmentDTO = z.infer<typeof UpdateDepartmentSchema>['body'];

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>['body'];
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>['body'];

export type CreateRoleDTO = z.infer<typeof CreateRoleSchema>['body'];
export type UpdateRoleDTO = z.infer<typeof UpdateRoleSchema>['body'];

export type CreatePermissionDTO = z.infer<typeof CreatePermissionSchema>['body'];
export type UpdatePermissionDTO = z.infer<typeof UpdatePermissionSchema>['body'];
