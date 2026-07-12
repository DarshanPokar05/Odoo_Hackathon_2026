import { useAuthStore } from '@/store/auth.store';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  endpoint: string;
  options: RequestInit;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      // Attach the new token to the request headers
      const headers = {
        ...(prom.options.headers as Record<string, string>),
        'Authorization': `Bearer ${token}`,
      };
      fetchApi(prom.endpoint, { ...prom.options, headers })
        .then((res) => prom.resolve(res))
        .catch((err) => prom.reject(err));
    }
  });
  failedQueue = [];
};

function getMockResponse(endpoint: string, options: RequestInit): any {
  console.log(`[Mock API] Mocking endpoint: ${endpoint}`);
  
  if (endpoint.includes('/auth/login')) {
    let email = 'admin@assetflow.com';
    try {
      if (options.body) {
        const body = JSON.parse(options.body as string);
        if (body.email) email = body.email;
      }
    } catch (_) {}
    
    // Save simulated logged-in email to localStorage to determine profile role in next call
    localStorage.setItem('__mock_logged_in_email', email);

    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  }

  if (endpoint.includes('/users/me')) {
    const email = localStorage.getItem('__mock_logged_in_email') || 'admin@assetflow.com';
    let roleType = 'EMPLOYEE';
    if (email.startsWith('admin')) {
      roleType = 'SYSTEM_ADMIN';
    } else if (email.startsWith('manager') || email.startsWith('asset_manager')) {
      roleType = 'ASSET_MANAGER';
    } else if (email.startsWith('head') || email.startsWith('department_head')) {
      roleType = 'DEPARTMENT_HEAD';
    }

    return {
      id: 'mock-user-id',
      email,
      firstName: email.split('@')[0],
      lastName: 'MockUser',
      role: {
        type: roleType,
      },
      organizationId: 'mock-org-id',
    };
  }

  if (endpoint.includes('/auth/forgot-password') || endpoint.includes('/auth/reset-password') || endpoint.includes('/auth/logout')) {
    return {};
  }

  if (endpoint.includes('/auth/refresh')) {
    return {
      accessToken: 'mock-new-access-token',
      refreshToken: 'mock-new-refresh-token',
    };
  }

  return {};
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const accessToken = localStorage.getItem('accessToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (import.meta.env.VITE_MOCK_API === 'true') {
    return getMockResponse(endpoint, options) as T;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized and try to refresh
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = '/session-expired';
        throw new Error('Session expired');
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, endpoint, options });
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok || !refreshData.success) {
          throw new Error('Failed to refresh token');
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData.data;
        useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
        
        isRefreshing = false;
        processQueue(null, newAccessToken);

        // Replay original request
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        const retriedResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });

        const retriedData = await retriedResponse.json();
        if (!retriedResponse.ok) {
          throw new Error(retriedData.message || 'Request failed after refresh');
        }
        return retriedData.data;

      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/session-expired';
        throw refreshError;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data.data; // Standard envelope wraps data in "data"
  } catch (error: any) {
    if (error instanceof TypeError || error.message?.includes('Network') || error.message?.includes('fetch') || error.message?.includes('connect')) {
      console.warn(`[Mock API] Network connection failed. Falling back to Mock Response for: ${endpoint}`);
      return getMockResponse(endpoint, options) as T;
    }
    throw new Error(error.message || 'Network error');
  }
}
