import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validationMiddleware';
import { authenticate } from '../../middlewares/authMiddleware';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.schema';

const router = Router();

router.post('/register', validate(RegisterSchema), AuthController.register);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/refresh', validate(RefreshTokenSchema), AuthController.refresh);
router.post('/forgot-password', validate(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(ResetPasswordSchema), AuthController.resetPassword);
router.post('/logout', authenticate, AuthController.logout);

export default router;
