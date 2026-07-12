import { LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../schemas/auth.schema';

describe('Auth Zod Schemas', () => {
  describe('LoginSchema', () => {
    it('should validate correct login inputs', () => {
      const result = LoginSchema.safeParse({
        email: 'employee@company.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid email format', () => {
      const result = LoginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should fail validation with empty password', () => {
      const result = LoginSchema.safeParse({
        email: 'employee@company.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ForgotPasswordSchema', () => {
    it('should validate correct email input', () => {
      const result = ForgotPasswordSchema.safeParse({
        email: 'employee@company.com',
      });
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid email format', () => {
      const result = ForgotPasswordSchema.safeParse({
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ResetPasswordSchema', () => {
    it('should validate passwords that match and satisfy length', () => {
      const result = ResetPasswordSchema.safeParse({
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should fail validation when passwords do not match', () => {
      const result = ResetPasswordSchema.safeParse({
        password: 'securePassword123',
        confirmPassword: 'differentPassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Passwords must match');
      }
    });

    it('should fail validation when password is too short', () => {
      const result = ResetPasswordSchema.safeParse({
        password: 'short',
        confirmPassword: 'short',
      });
      expect(result.success).toBe(false);
    });
  });
});
