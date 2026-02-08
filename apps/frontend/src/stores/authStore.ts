import { create } from 'zustand';
import { authService, type User, type LoginData, type RegisterData } from '../services/auth.service';
import type { ApiError } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User, accessToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      error: null,
    }),

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.message || 'Registration failed',
      });
      throw error;
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(data);
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.message || 'Login failed',
      });
      throw error;
    }
  },

  logout: async () => {
    const { accessToken } = get();
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  updateAccessToken: (accessToken) =>
    set({
      accessToken,
    }),
}));
