const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

export class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const apiError: ApiError = {
          message: data.error?.message || 'Request failed',
          code: data.error?.code,
          statusCode: response.status,
        };

        // Handle 401 errors - attempt to refresh token
        if (response.status === 401 && !isRetry && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
          const newAccessToken = await this.handleTokenRefresh();
          
          if (newAccessToken) {
            // Update authorization header and retry request
            const retryConfig: RequestInit = {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${newAccessToken}`,
              },
            };
            return this.request<T>(endpoint, retryConfig, true);
          }
        }

        throw apiError;
      }

      return data as T;
    } catch (error) {
      if ((error as ApiError).statusCode) {
        throw error;
      }
      throw {
        message: 'Network error',
        statusCode: 0,
      } as ApiError;
    }
  }

  private async handleTokenRefresh(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = (async () => {
      try {
        // Get auth store dynamically to avoid circular dependency
        const { useAuthStore } = await import('../stores/authStore');
        const authStore = useAuthStore.getState();
        const refreshToken = authStore.refreshToken;

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const { authService } = await import('../services/auth.service');
        const { accessToken } = await authService.refreshToken(refreshToken);

        // Update token in store
        authStore.setUser(authStore.user!, accessToken, refreshToken);

        return accessToken;
      } catch (error) {
        // Refresh failed - logout user
        console.error('Token refresh failed:', error);
        const { useAuthStore } = await import('../stores/authStore');
        await useAuthStore.getState().logout();
        
        // Redirect to login
        window.location.href = '/login';
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

export const apiClient = new ApiClient();
