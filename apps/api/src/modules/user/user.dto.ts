import { z } from 'zod';
import {
  CreateUserSchema,
  UpdateUserSchema,
  AssignRoleSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from './user.schema';

export type CreateUserDTO = z.infer<typeof CreateUserSchema>['body'];
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>['body'];
export type AssignRoleDTO = z.infer<typeof AssignRoleSchema>['body'];
export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>['body'];
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>['body'];

export interface UserQueryFilters {
  departmentId?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
}
