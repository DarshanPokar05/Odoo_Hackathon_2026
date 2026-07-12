import { z } from 'zod';
import { RegisterSchema, LoginSchema, RefreshTokenSchema, ForgotPasswordSchema, ResetPasswordSchema } from './auth.schema';

export type RegisterDTO = z.infer<typeof RegisterSchema>['body'];
export type LoginDTO = z.infer<typeof LoginSchema>['body'];
export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>['body'];
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>['body'];
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>['body'];
