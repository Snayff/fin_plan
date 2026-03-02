import { create } from 'zustand';
import { authService, type User, type LoginData, type RegisterData } from '../services/auth.service';
import type { ApiError } from '../lib/api';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  isLoading: boolean;
  error: string | null;

  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User, accessToken: string) => void;
  setUnauthenticated: () => void;
  updateAccessToken: (accessToken: string) => void;
}

let initializationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authStatus: 'initializing',
  isLoading: false,
  error: null,

  setUser: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      authStatus: 'authenticated',
      error: null,
    }),

  setUnauthenticated: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authStatus: 'unauthenticated',
      isLoading: false,
      error: null,
    }),

  initializeAuth: async () => {
    if (get().authStatus !== 'initializing') {
      return;
    }

    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      try {
        const { accessToken } = await authService.refreshToken();
        const { user } = await authService.getCurrentUser(accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          authStatus: 'authenticated',
          isLoading: false,
          error: null,
        });
      } catch {
        get().setUnauthenticated();
      } finally {
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        authStatus: 'authenticated',
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
        authStatus: 'authenticated',
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

    get().setUnauthenticated();
  },

  clearError: () => set({ error: null }),

  updateAccessToken: (accessToken) =>
    set({
      accessToken,
    }),
}));
