import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { householdService } from "../../services/household.service";
import { authService } from "../../services/auth.service";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { MenuIcon, ChevronDownIcon, HomeIcon, PlusIcon } from "lucide-react";

function HouseholdSwitcher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser, accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const { data } = useQuery({
    queryKey: ["households"],
    queryFn: () => householdService.getHouseholds(),
    enabled: !!user,
  });

  const households = data?.households ?? [];
  const current = households.find((m) => m.household.id === user?.activeHouseholdId);

  const handleSwitch = async (id: string) => {
    if (id === user?.activeHouseholdId || isSwitching) return;
    setIsSwitching(true);
    setOpen(false);
    try {
      await householdService.switchHousehold(id);
      const { user: updatedUser } = await authService.getCurrentUser(accessToken!);
      setUser(updatedUser, accessToken!);
      queryClient.invalidateQueries();
      navigate("/dashboard");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
        disabled={isSwitching}
      >
        <HomeIcon className="h-4 w-4 shrink-0" />
        <span className="max-w-[140px] truncate">{current?.household.name ?? "My Household"}</span>
        <ChevronDownIcon className="h-3 w-3 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-md border border-border bg-card shadow-lg">
            <div className="py-1">
              {households.map((m) => (
                <button
                  key={m.household.id}
                  onClick={() => handleSwitch(m.household.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    m.household.id === user?.activeHouseholdId
                      ? "text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <HomeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{m.household.name}</span>
                  {m.household.id === user?.activeHouseholdId && (
                    <span className="ml-auto text-xs text-primary">active</span>
                  )}
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => { setOpen(false); navigate("/profile"); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create household
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Accounts", href: "/accounts" },
    { name: "Transactions", href: "/transactions" },
    { name: "Assets", href: "/assets" },
    { name: "Liabilities", href: "/liabilities" },
    { name: "Budget", href: "/budget" },
    { name: "Goals", href: "/goals" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile hamburger */}
              <div className="flex sm:hidden mr-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                      <MenuIcon className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 pt-12">
                    <nav className="flex flex-col gap-1 mt-2">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            location.pathname === item.href
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    <div className="border-t border-border mt-4 pt-4 flex flex-col gap-1">
                      <Link
                        to="/profile"
                        className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={logout}
                        className="text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary">FinPlan</span>
              </div>

              {/* Desktop nav links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === item.href
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <HouseholdSwitcher />
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                >
                  {user?.name}
                  <ChevronDownIcon className="h-3 w-3 shrink-0" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-md border border-border bg-card shadow-lg">
                      <div className="py-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                          className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          View Profile
                        </button>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
