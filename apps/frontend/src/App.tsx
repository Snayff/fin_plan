import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from "./stores/authStore";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AcceptInvitePage from "./pages/auth/AcceptInvitePage";
import DashboardPage from "./pages/DashboardPage";
import Dashboard1Page from "./pages/Dashboard1Page";
import Dashboard2Page from "./pages/Dashboard2Page";
import ProfilePage from "./pages/ProfilePage";
import AccountsPage from "./pages/AccountsPage";
import TransactionsPage from "./pages/TransactionsPage";
import AssetsPage from "./pages/AssetsPage";
import LiabilitiesPage from "./pages/LiabilitiesPage";
import GoalsPage from "./pages/GoalsPage";
import BudgetsPage from "./pages/BudgetsPage";
import BudgetDetailPage from "./pages/BudgetDetailPage";
import Layout from "./components/layout/Layout";
import DesignPage from "./pages/DesignPage";
import Dashboard3Page from "./pages/Dashboard3Page";
import Dashboard4Page from "./pages/Dashboard4Page";
import Dashboard5Page from "./pages/Dashboard5Page";
import Dashboard6Page from "./pages/Dashboard6Page";
import Dashboard7Page from "./pages/Dashboard7Page";
import Dashboard8Page from "./pages/Dashboard8Page";
import Dashboard9Page from "./pages/Dashboard9Page";
import Dashboard10Page from "./pages/Dashboard10Page";
import Dashboard11Page from "./pages/Dashboard11Page";
import Dashboard12Page from "./pages/Dashboard12Page";
import Dashboard13Page from "./pages/Dashboard13Page";

export function ProtectedAppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="dashboard1" element={<Dashboard1Page />} />
        <Route path="dashboard2" element={<Dashboard2Page />} />
        <Route path="dashboard3" element={<Dashboard3Page />} />
        <Route path="dashboard4" element={<Dashboard4Page />} />
        <Route path="dashboard5" element={<Dashboard5Page />} />
        <Route path="dashboard6" element={<Dashboard6Page />} />
        <Route path="dashboard7" element={<Dashboard7Page />} />
        <Route path="dashboard8" element={<Dashboard8Page />} />
        <Route path="dashboard9" element={<Dashboard9Page />} />
        <Route path="dashboard10" element={<Dashboard10Page />} />
        <Route path="dashboard11" element={<Dashboard11Page />} />
        <Route path="dashboard12" element={<Dashboard12Page />} />
        <Route path="dashboard13" element={<Dashboard13Page />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="liabilities" element={<LiabilitiesPage />} />
        <Route path="budget" element={<BudgetsPage />} />
        <Route path="budget/:id" element={<BudgetDetailPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="settings/household" element={<Navigate to="/profile" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

const DASHBOARD_PREVIEWS: Record<string, React.ComponentType> = {
  '/dashboard1': Dashboard1Page,
  '/dashboard2': Dashboard2Page,
  '/dashboard3': Dashboard3Page,
  '/dashboard4': Dashboard4Page,
  '/dashboard5': Dashboard5Page,
  '/dashboard6': Dashboard6Page,
  '/dashboard7': Dashboard7Page,
  '/dashboard8': Dashboard8Page,
  '/dashboard9': Dashboard9Page,
  '/dashboard10': Dashboard10Page,
  '/dashboard11': Dashboard11Page,
  '/dashboard12': Dashboard12Page,
  '/dashboard13': Dashboard13Page,
};

function App() {
  const authStatus = useAuthStore((state) => state.authStatus);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isDesignPage = import.meta.env.DEV && window.location.pathname.startsWith('/design');
  const isDashboardPreview = import.meta.env.DEV && window.location.pathname in DASHBOARD_PREVIEWS;
  const isAuthenticated = authStatus === 'authenticated';

  useEffect(() => {
    if (isDesignPage) {
      return;
    }
    void initializeAuth();
  }, [initializeAuth, isDesignPage]);

  // Design reference: bypass React Router v7 entirely for this dev-only page
  if (isDesignPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <DesignPage />
      </QueryClientProvider>
    );
  }

  if (authStatus === 'initializing') {
    return (
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          Restoring secure session...
        </div>
      </QueryClientProvider>
    );
  }

  // Dashboard design previews: render after auth resolves so API calls have a token.
  if (isDashboardPreview) {
    const Page = DASHBOARD_PREVIEWS[window.location.pathname]!;
    return (
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<Page />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

        {/* Protected routes */}
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
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
