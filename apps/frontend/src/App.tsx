import { useEffect } from "react";
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

export function ProtectedAppRoutes() {
  return (
    <Layout>
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
    </Layout>
  );
}

function App() {
  const authStatus = useAuthStore((state) => state.authStatus);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isDesignPage = import.meta.env.DEV && window.location.pathname.startsWith('/design');
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
