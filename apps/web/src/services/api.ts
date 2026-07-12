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

function getLocalMockAssets(): any[] {
  const stored = localStorage.getItem('__mock_assets');
  if (stored) return JSON.parse(stored);

  const initial = [
    {
      id: "asset-1",
      assetTag: "AST-2026-001",
      name: "MacBook Pro 16\"",
      categoryId: "cat-laptop",
      serialNumber: "C02DF829MD6M",
      manufacturer: "Apple",
      model: "M3 Max 64GB",
      acquisitionDate: "2026-01-10",
      acquisitionCost: 3499,
      currentValue: 3200,
      location: "HQ - 4th Floor",
      condition: "NEW",
      status: "AVAILABLE",
      isBookable: true,
      createdAt: "2026-01-10T12:00:00Z",
      updatedAt: "2026-01-10T12:00:00Z",
      category: { id: "cat-laptop", name: "Laptops" },
      images: [
        { id: "img-1", assetId: "asset-1", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80", displayOrder: 0 }
      ],
      documents: [
        { id: "doc-1", assetId: "asset-1", documentName: "User Manual.pdf", documentUrl: "https://www.apple.com/user-manuals/macbook", documentType: "PDF" }
      ]
    },
    {
      id: "asset-2",
      assetTag: "AST-2026-002",
      name: "Dell UltraSharp 27\" Monitor",
      categoryId: "cat-monitor",
      serialNumber: "CN-0F829M-1029",
      manufacturer: "Dell",
      model: "U2723QE",
      acquisitionDate: "2026-02-15",
      acquisitionCost: 599,
      currentValue: 500,
      location: "HQ - 3rd Floor",
      condition: "GOOD",
      status: "ALLOCATED",
      isBookable: false,
      createdAt: "2026-02-15T10:00:00Z",
      updatedAt: "2026-02-15T10:00:00Z",
      category: { id: "cat-monitor", name: "Monitors" },
      images: [
        { id: "img-2", assetId: "asset-2", imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80", displayOrder: 0 }
      ],
      documents: []
    },
    {
      id: "asset-3",
      assetTag: "AST-2026-003",
      name: "Herman Miller Aeron Chair",
      categoryId: "cat-furniture",
      serialNumber: "HM-AERON-9821",
      manufacturer: "Herman Miller",
      model: "Aeron Size B",
      acquisitionDate: "2026-03-01",
      acquisitionCost: 1299,
      currentValue: 1100,
      location: "HQ - Room 204",
      condition: "GOOD",
      status: "AVAILABLE",
      isBookable: true,
      createdAt: "2026-03-01T09:00:00Z",
      updatedAt: "2026-03-01T09:00:00Z",
      category: { id: "cat-furniture", name: "Office Furniture" },
      images: [],
      documents: []
    }
  ];
  localStorage.setItem('__mock_assets', JSON.stringify(initial));
  return initial;
}

function saveLocalMockAssets(assets: any[]) {
  localStorage.setItem('__mock_assets', JSON.stringify(assets));
}

function getLocalMockCategories(): any[] {
  return [
    { id: "cat-laptop", name: "Laptops", code: "LAPTOP" },
    { id: "cat-monitor", name: "Monitors", code: "MONITOR" },
    { id: "cat-furniture", name: "Office Furniture", code: "FURNITURE" }
  ];
}

function getLocalMockHistory(assetId: string): any[] {
  const stored = localStorage.getItem(`__mock_history_${assetId}`);
  if (stored) return JSON.parse(stored);

  const initial = [
    {
      id: "hist-1",
      assetId,
      action: "CREATED",
      performedBy: "mock-user-id",
      performedAt: "2026-01-10T12:00:00Z",
      remarks: "Asset registered in the system",
      performer: { id: "mock-user-id", firstName: "Admin", lastName: "User", email: "admin@assetflow.com" }
    }
  ];
  localStorage.setItem(`__mock_history_${assetId}`, JSON.stringify(initial));
  return initial;
}

function addMockHistory(assetId: string, action: string, remarks: string) {
  const history = getLocalMockHistory(assetId);
  history.unshift({
    id: `hist-${Date.now()}`,
    assetId,
    action,
    performedBy: "mock-user-id",
    performedAt: new Date().toISOString(),
    remarks,
    performer: { id: "mock-user-id", firstName: "Admin", lastName: "User", email: "admin@assetflow.com" }
  });
  localStorage.setItem(`__mock_history_${assetId}`, JSON.stringify(history));
}

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

  if (endpoint.includes('/organization/categories')) {
    return getLocalMockCategories();
  }

  if (endpoint.match(/\/assets\/[^/]+\/history/)) {
    const assetId = endpoint.split('/')[2];
    return getLocalMockHistory(assetId);
  }

  if (endpoint.match(/\/assets\/[^/]+/) && options.method === 'DELETE') {
    const assetId = endpoint.split('/')[2];
    const assets = getLocalMockAssets();
    const filtered = assets.filter(a => a.id !== assetId);
    saveLocalMockAssets(filtered);
    return { success: true };
  }

  if (endpoint.match(/\/assets\/[^/]+/) && options.method === 'PATCH') {
    const assetId = endpoint.split('/')[2];
    const body = JSON.parse(options.body as string);
    const assets = getLocalMockAssets();
    const idx = assets.findIndex(a => a.id === assetId);
    if (idx !== -1) {
      const cats = getLocalMockCategories();
      const cat = cats.find(c => c.id === body.categoryId);
      assets[idx] = {
        ...assets[idx],
        ...body,
        updatedAt: new Date().toISOString(),
        category: cat ? { id: cat.id, name: cat.name } : assets[idx].category
      };
      saveLocalMockAssets(assets);
      addMockHistory(assetId, "UPDATED", "Asset details updated in Demo Mode");
      return assets[idx];
    }
    throw new Error('Asset not found');
  }

  if (endpoint.match(/\/assets\/[^/]+/) && options.method === 'GET') {
    const assetId = endpoint.split('/')[2];
    const assets = getLocalMockAssets();
    const asset = assets.find(a => a.id === assetId);
    if (asset) return asset;
    throw new Error('Asset not found');
  }

  if (endpoint === '/assets' && options.method === 'POST') {
    const body = JSON.parse(options.body as string);
    const assets = getLocalMockAssets();
    const cats = getLocalMockCategories();
    const cat = cats.find(c => c.id === body.categoryId);
    const newAsset = {
      id: `asset-${Date.now()}`,
      assetTag: body.assetTag || `AST-2026-0${assets.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "AVAILABLE",
      category: cat ? { id: cat.id, name: cat.name } : { id: "unknown", name: "General" },
      images: body.images || [],
      documents: body.documents || [],
      ...body
    };
    assets.push(newAsset);
    saveLocalMockAssets(assets);
    addMockHistory(newAsset.id, "CREATED", "Asset registered in Demo Mode");
    return newAsset;
  }

  if (endpoint.startsWith('/assets')) {
    const searchParamsPart = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    const urlParams = new URLSearchParams(searchParamsPart);
    const search = urlParams.get('search')?.toLowerCase() || '';
    const categoryId = urlParams.get('categoryId') || '';
    const status = urlParams.get('status') || '';
    const condition = urlParams.get('condition') || '';
    const sortBy = urlParams.get('sortBy') || 'createdAt';
    const sortOrder = urlParams.get('sortOrder') || 'desc';
    const page = parseInt(urlParams.get('page') || '1');
    const limit = parseInt(urlParams.get('limit') || '20');

    let result = getLocalMockAssets();

    if (search) {
      result = result.filter(a => 
        a.name.toLowerCase().includes(search) || 
        a.assetTag.toLowerCase().includes(search) || 
        (a.serialNumber && a.serialNumber.toLowerCase().includes(search))
      );
    }
    if (categoryId) {
      result = result.filter(a => a.categoryId === categoryId);
    }
    if (status) {
      result = result.filter(a => a.status === status);
    }
    if (condition) {
      result = result.filter(a => a.condition === condition);
    }

    result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'category') {
        valA = a.category?.name ?? '';
        valB = b.category?.name ?? '';
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      assets: paginated,
      total
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
