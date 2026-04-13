import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, ChevronDown, Plus } from "lucide-react";
import { householdService } from "@/services/household.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { CreateHouseholdDialog } from "./CreateHouseholdDialog";

export function HouseholdSwitcher() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["households"],
    queryFn: () => householdService.getHouseholds(),
    enabled: !!user,
  });

  const switchMutation = useMutation({
    mutationFn: (id: string) => householdService.switchHousehold(id),
    onSuccess: async () => {
      if (accessToken) {
        const { user: updatedUser } = await authService.getCurrentUser(accessToken);
        setUser(updatedUser, accessToken);
      }
      qc.invalidateQueries();
      navigate("/overview");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to switch household");
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => householdService.createHousehold(name),
    onSuccess: async () => {
      if (accessToken) {
        const { user: updatedUser } = await authService.getCurrentUser(accessToken);
        setUser(updatedUser, accessToken);
      }
      qc.invalidateQueries();
      navigate("/overview");
      setShowCreate(false);
      toast.success("Household created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create household");
    },
  });

  const households = data?.households ?? [];
  const activeId = user?.activeHouseholdId;
  const activeName =
    households.find((h) => h.household.id === activeId)?.household.name ?? "My household";

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors truncate max-w-[160px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{activeName}</span>
        <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-md border bg-popover shadow-lg z-50">
          {households.map(({ household }) => (
            <button
              key={household.id}
              type="button"
              className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => {
                if (household.id !== activeId) switchMutation.mutate(household.id);
                else setIsOpen(false);
              }}
            >
              <span className="truncate">{household.name}</span>
              {household.id === activeId && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </button>
          ))}
          <div className="border-t" />
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
            onClick={() => {
              setIsOpen(false);
              setShowCreate(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create new household
          </button>
        </div>
      )}

      <CreateHouseholdDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onConfirm={(name) => createMutation.mutate(name)}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
