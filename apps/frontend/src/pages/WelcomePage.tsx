import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { householdService } from "@/services/household.service";
import { authService } from "@/services/auth.service";
import { usePrefersReducedMotion } from "@/utils/motion";

type Phase = "welcome" | "name" | "celebrate";

export default function WelcomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [phase, setPhase] = useState<Phase>("welcome");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // If user already has a household and we're not celebrating, redirect
  useEffect(() => {
    if (user?.activeHouseholdId && phase === "welcome") {
      navigate("/overview", { replace: true });
    }
  }, [user?.activeHouseholdId, navigate, phase]);

  const handleCreateHousehold = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { household } = await householdService.createHousehold(name.trim());
      await householdService.switchHousehold(household.id);
      // Refresh user to get updated activeHouseholdId
      if (accessToken) {
        const { user: refreshed } = await authService.getCurrentUser(accessToken);
        setUser(refreshed, accessToken);
      }
      setPhase("celebrate");
      setShowConfetti(true);
    } catch {
      toast.error("Failed to create household");
    } finally {
      setSaving(false);
    }
  }, [name, accessToken, setUser]);

  function handleContinue() {
    navigate("/overview?build=1", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {phase === "welcome" && (
          <>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to FinPlan</h1>
              <p className="text-muted-foreground leading-relaxed">
                FinPlan helps you see exactly where your money goes each month using a simple
                waterfall: income flows down through committed bills, discretionary spending, and
                savings — revealing your true surplus.
              </p>
            </div>
            <Button size="lg" onClick={() => setPhase("name")}>
              Get started
            </Button>
          </>
        )}

        {phase === "name" && (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight">Name your household</h1>
              <p className="text-muted-foreground">
                This is the home for your financial plan. You can invite others to collaborate
                later.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreateHousehold();
              }}
              className="space-y-4"
            >
              <Input
                placeholder="e.g. The Smiths, Our flat, My finances"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="text-center text-lg h-12"
              />
              <div className="flex gap-3 justify-center">
                <Button type="button" variant="ghost" onClick={() => setPhase("welcome")}>
                  Back
                </Button>
                <Button type="submit" disabled={saving || !name.trim()}>
                  {saving ? "Creating…" : "Create household"}
                </Button>
              </div>
            </form>
          </>
        )}

        {phase === "celebrate" && (
          <>
            {/* Confetti burst */}
            {showConfetti && <ConfettiBurst onDone={() => setShowConfetti(false)} />}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight">{name} is ready!</h1>
              <p className="text-muted-foreground">
                Now let's build your waterfall — we'll guide you through adding your income, bills,
                and spending step by step.
              </p>
            </div>
            <Button size="lg" onClick={handleContinue}>
              Build my waterfall →
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** Simple CSS confetti animation */
function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (prefersReducedMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: 40 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 1.5 + Math.random() * 1.5;
        const size = 6 + Math.random() * 6;
        const colors = ["#0ea5e9", "#6366f1", "#a855f7", "#4adcd0"];
        const color = colors[i % colors.length];
        const rotation = Math.random() * 360;
        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${left}%`,
              top: "-10px",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
