import { fetchApi } from '@/services/api';
import { LoginResponse } from '../types/auth.types';
import { LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../schemas/auth.schema';

export const authApi = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    return fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  forgotPassword: async (data: ForgotPasswordInput): Promise<void> => {
    return fetchApi<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resetPassword: async (data: ResetPasswordInput & { token: string }): Promise<void> => {
    return fetchApi<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: data.token,
        newPassword: data.password,
      }),
    });
  },

  logout: async (): Promise<void> => {
    return fetchApi<void>('/auth/logout', {
      method: 'POST',
    });
  },
};
