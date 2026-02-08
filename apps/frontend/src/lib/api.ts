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
  private csrfToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch CSRF token from server
   */
  private async fetchCsrfToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    const response = await fetch(`${this.baseUrl}/api/auth/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    this.csrfToken = data.csrfToken;
    return this.csrfToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get CSRF token for state-changing requests
    let csrfToken: string | undefined;
    if (['POST', 'PUT', 'DELETE'].includes(options.method || 'GET')) {
      try {
        csrfToken = await this.fetchCsrfToken();
      } catch (error) {
        // CSRF fetch failed - continue without it for auth endpoints
        // Auth endpoints don't need CSRF yet (legacy support)
      }
    }

    const config: RequestInit = {
      ...options,
      credentials: 'include', // CRITICAL: Send cookies
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
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

        // Handle CSRF token errors
        if (response.status === 403 && data.error?.code === 'FST_CSRF_INVALID_TOKEN') {
          // Clear cached CSRF token and retry
          this.csrfToken = null;
          if (!isRetry) {
            return this.request<T>(endpoint, options, true);
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

        // Call refresh endpoint - refreshToken is in httpOnly cookie
        const { authService } = await import('../services/auth.service');
        const { accessToken } = await authService.refreshToken();

        // Update token in store
        authStore.setUser(authStore.user!, accessToken);

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
