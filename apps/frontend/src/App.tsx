import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/layout/Layout";

// Auth pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const AcceptInvitePage = lazy(() => import("./pages/auth/AcceptInvitePage"));

// App pages
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const WealthPage = lazy(() => import("./pages/WealthPage"));
const PlannerPage = lazy(() => import("./pages/PlannerPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DesignRenewPage = lazy(() => import("./pages/DesignRenewPage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
    Loading...
  </div>
);

function NewUserRedirect({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user && !user.activeHouseholdId) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}

export function ProtectedAppRoutes() {
  return (
    <Routes>
      <Route
        path="/welcome"
        element={
          <Suspense fallback={<PageLoader />}>
            <WelcomePage />
          </Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <NewUserRedirect>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/overview" replace />} />
                  <Route path="/overview" element={<OverviewPage />} />
                  <Route path="/wealth" element={<WealthPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/overview" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </NewUserRedirect>
        }
      />
    </Routes>
  );
}

function App() {
  const authStatus = useAuthStore((state) => state.authStatus);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const pathname = window.location.pathname;
  const isDesignRenewPage = import.meta.env.DEV && pathname === "/design-renew";
  const isAuthenticated = authStatus === "authenticated";

  useEffect(() => {
    if (isDesignRenewPage) return;
    void initializeAuth();
  }, [initializeAuth, isDesignRenewPage]);

  return (
    <QueryClientProvider client={queryClient}>
      {isDesignRenewPage ? (
        <Suspense fallback={<PageLoader />}>
          <DesignRenewPage />
        </Suspense>
      ) : authStatus === "initializing" ? (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          Restoring secure session...
        </div>
      ) : (
        <>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/login"
                  element={isAuthenticated ? <Navigate to="/overview" /> : <LoginPage />}
                />
                <Route
                  path="/register"
                  element={isAuthenticated ? <Navigate to="/overview" /> : <RegisterPage />}
                />
                <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
                <Route
                  path="/*"
                  element={isAuthenticated ? <ProtectedAppRoutes /> : <Navigate to="/login" />}
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </QueryClientProvider>
  );
}

export default App;
