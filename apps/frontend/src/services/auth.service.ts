import { apiClient } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    currency: string;
    dateFormat: string;
    theme: string;
    defaultInflationRate: number;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/register', data);
  },

  async login(data: LoginData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/login', data);
  },

  async logout(token: string): Promise<void> {
    await apiClient.post('/api/auth/logout', {}, token);
  },

  async getCurrentUser(token: string): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>('/api/auth/me', token);
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return apiClient.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken });
  },
};
