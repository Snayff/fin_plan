import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Don't retry on 401 (token refresh is handled by the API client) or 429 (rate limited — retrying amplifies the problem)
      retry: (failureCount, error: any) =>
        error?.statusCode !== 401 && error?.statusCode !== 429 && failureCount < 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      onError: (error: any) => {
        if (error?.statusCode === 401) {
          import("../stores/authStore").then(({ useAuthStore }) => {
            useAuthStore.getState().setUnauthenticated();
            window.location.href = "/login";
          });
        }
      },
    },
  },
});
