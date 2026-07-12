import { Router } from 'express';
import { DepartmentController } from './controllers/department.controller';
import { CategoryController } from './controllers/category.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { validate } from '../../middlewares/validationMiddleware';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
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

const router = Router();

router.use(authenticate); // All organization routes require authentication

// Departments
router.post('/departments', authorize('ADMIN'), validate(CreateDepartmentSchema), DepartmentController.create);
router.get('/departments', DepartmentController.getAll);
router.get('/departments/:id', DepartmentController.getById);
router.patch('/departments/:id', authorize('ADMIN'), validate(UpdateDepartmentSchema), DepartmentController.update);
router.delete('/departments/:id', authorize('ADMIN'), DepartmentController.delete);

// Categories
router.post('/categories', authorize('ADMIN'), validate(CreateCategorySchema), CategoryController.create);
router.get('/categories', CategoryController.getAll);
router.get('/categories/:id', CategoryController.getById);
router.patch('/categories/:id', authorize('ADMIN'), validate(UpdateCategorySchema), CategoryController.update);
router.delete('/categories/:id', authorize('ADMIN'), CategoryController.delete);

// Roles
router.post('/roles', authorize('ADMIN'), validate(CreateRoleSchema), RoleController.create);
router.get('/roles', RoleController.getAll);
router.get('/roles/:id', RoleController.getById);
router.patch('/roles/:id', authorize('ADMIN'), validate(UpdateRoleSchema), RoleController.update);
router.delete('/roles/:id', authorize('ADMIN'), RoleController.delete);

// Permissions
router.post('/permissions', authorize('ADMIN'), validate(CreatePermissionSchema), PermissionController.create);
router.get('/permissions', PermissionController.getAll);
router.get('/permissions/:id', PermissionController.getById);
router.patch('/permissions/:id', authorize('ADMIN'), validate(UpdatePermissionSchema), PermissionController.update);
router.delete('/permissions/:id', authorize('ADMIN'), PermissionController.delete);

export default router;
