import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '../services/auth.api';
import { LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../schemas/auth.schema';
import { fetchApi } from '@/services/api';
import { toast } from 'sonner';

export function useAuth() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logoutStore = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      // 1. Call login endpoint
      const response = await authApi.login(data);

      // 2. Fetch full profile with the newly obtained token to resolve the role
      const profile = await fetchApi<any>('/users/me', {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`,
        },
      });

      // 3. Map backend RoleType to frontend UserRole
      let userRole: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE' = 'EMPLOYEE';
      if (profile.role && profile.role.type) {
        const type = profile.role.type;
        if (type === 'SYSTEM_ADMIN') {
          userRole = 'ADMIN';
        } else if (type === 'ASSET_MANAGER') {
          userRole = 'ASSET_MANAGER';
        } else if (type === 'DEPARTMENT_HEAD') {
          userRole = 'DEPARTMENT_HEAD';
        }
      }

      return {
        tokens: response,
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: userRole,
          organizationId: profile.organizationId || null,
        },
      };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      toast.success('Successfully logged in');
      queryClient.invalidateQueries();
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordInput) => authApi.forgotPassword(data),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordInput & { token: string }) => authApi.resetPassword(data),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Still log out locally even if API call fails
      logoutStore();
      queryClient.clear();
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    
    forgotPassword: forgotPasswordMutation.mutate,
    isForgotPasswordPending: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,
    isForgotPasswordSuccess: forgotPasswordMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutate,
    isResetPasswordPending: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
    isResetPasswordSuccess: resetPasswordMutation.isSuccess,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
