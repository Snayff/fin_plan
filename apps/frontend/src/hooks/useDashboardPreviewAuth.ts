import { useAuthStore } from '../stores/authStore';

/**
 * Dashboard preview pages mount outside the normal protected route tree in dev.
 * Hold API queries until auth bootstrap has produced a usable access token.
 */
export function useDashboardPreviewAuth() {
  const authStatus = useAuthStore((state) => state.authStatus);

  return {
    authStatus,
    queriesEnabled: authStatus === 'authenticated',
    isBootstrappingAuth: authStatus === 'initializing',
  };
}
