import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '../../middlewares/validationMiddleware';
import { ActivityController } from '../activity/activity.controller';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import {
  CreateUserSchema,
  UpdateUserSchema,
  AssignRoleSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from './user.schema';

const router = Router();

router.use(authenticate); // All user routes require authentication

// Profile Management (Self)
router.get('/me', UserController.getProfile);
router.patch('/me', validate(UpdateProfileSchema), UserController.updateProfile);
router.patch('/me/password', validate(ChangePasswordSchema), UserController.changePassword);

// Employee Directory (Admin Only for Mutations)
router.post('/', authorize('ADMIN'), validate(CreateUserSchema), UserController.create);
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.get('/:id/activity', ActivityController.getUserLogs);
router.patch('/:id', authorize('ADMIN'), validate(UpdateUserSchema), UserController.update);
router.patch('/:id/role', authorize('ADMIN'), validate(AssignRoleSchema), UserController.assignRole);
router.patch('/:id/activate', authorize('ADMIN'), UserController.activate);
router.patch('/:id/deactivate', authorize('ADMIN'), UserController.deactivate);

export default router;
