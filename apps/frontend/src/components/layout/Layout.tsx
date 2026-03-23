import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { HouseholdSwitcher } from "./HouseholdSwitcher";

const NAV_ITEMS = [
  { label: "Overview", path: "/overview" },
  { label: "Wealth", path: "/wealth" },
  { label: "Planner", path: "/planner" },
  { label: "Settings", path: "/settings" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="h-12 shrink-0 border-b flex items-center px-4 gap-6">
        {/* Left: wordmark + switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-base tracking-tight text-foreground">finplan</span>
          <HouseholdSwitcher />
        </div>

        {/* Centre: nav */}
        <nav className="flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                [
                  "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right: user + sign out */}
        <div className="flex items-center gap-3 shrink-0">
          {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
