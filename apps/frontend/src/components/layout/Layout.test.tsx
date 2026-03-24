import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";
import { useAuthStore } from "@/stores/authStore";

mock.module("@/hooks/useStaleDataBanner", () => ({
  useStaleDataBanner: () => ({ showBanner: true, lastSyncedAt: new Date() }),
}));

function renderLayout() {
  useAuthStore.setState({
    user: { id: "1", name: "Test", email: "t@test.com" } as any,
    accessToken: "tok",
    isAuthenticated: true,
    authStatus: "authenticated",
  } as any);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Layout StaleDataBanner", () => {
  it("renders StaleDataBanner when useStaleDataBanner returns showBanner=true", () => {
    renderLayout();
    expect(screen.getByText(/data may be outdated/i)).toBeTruthy();
  });
});
