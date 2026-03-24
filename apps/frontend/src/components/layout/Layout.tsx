import { type ReactNode, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { HouseholdSwitcher } from "./HouseholdSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  const [navOpen, setNavOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-foreground focus:rounded-md focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      {/* Top bar */}
      <header className="h-12 shrink-0 border-b flex items-center px-4 gap-6">
        {/* Left: wordmark + switcher */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <nav className="flex flex-col gap-1 p-4 pt-8">
                {NAV_ITEMS.map(({ label, path }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setNavOpen(false)}
                    className={({ isActive }) =>
                      [
                        "px-3 py-2 rounded text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      ].join(" ")
                    }
                  >
                    {label}
                  </NavLink>
                ))}
                <div className="border-t mt-4 pt-4 space-y-2">
                  {user && (
                    <span className="block text-sm text-muted-foreground px-3">{user.name}</span>
                  )}
                  <button
                    onClick={() => {
                      setNavOpen(false);
                      void handleSignOut();
                    }}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                    type="button"
                  >
                    Sign out
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <span className="font-heading font-bold text-lg tracking-tight text-foreground">
            finplan
          </span>
          <HouseholdSwitcher />
        </div>

        {/* Centre: nav (desktop) */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
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

        {/* Right: user + sign out (desktop) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
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
      <main id="main-content" className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
