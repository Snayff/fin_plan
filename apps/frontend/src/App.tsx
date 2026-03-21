import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/layout/Layout";

// Auth pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const AcceptInvitePage = lazy(() => import("./pages/auth/AcceptInvitePage"));

// App pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AccountsPage = lazy(() => import("./pages/AccountsPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const LiabilitiesPage = lazy(() => import("./pages/LiabilitiesPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const BudgetsPage = lazy(() => import("./pages/BudgetsPage"));
const BudgetDetailPage = lazy(() => import("./pages/BudgetDetailPage"));
const DesignPage = lazy(() => import("./pages/DesignPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
    Loading...
  </div>
);

export function ProtectedAppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/liabilities" element={<LiabilitiesPage />} />
          <Route path="/budget" element={<BudgetsPage />} />
          <Route path="/budget/:id" element={<BudgetDetailPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/settings/household" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  const authStatus = useAuthStore((state) => state.authStatus);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isDesignPage = import.meta.env.DEV && window.location.pathname.startsWith('/design');
  const isAuthenticated = authStatus === 'authenticated';

  useEffect(() => {
    if (isDesignPage) return;
    void initializeAuth();
  }, [initializeAuth, isDesignPage]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      {isDesignPage ? (
        <Suspense fallback={<PageLoader />}>
          <DesignPage />
        </Suspense>
      ) : authStatus === 'initializing' ? (
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
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
                />
                <Route
                  path="/register"
                  element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
                />
                <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
                <Route
                  path="/*"
                  element={
                    isAuthenticated ? (
                      <ProtectedAppRoutes />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
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
