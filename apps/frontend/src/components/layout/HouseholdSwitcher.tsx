import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { householdService } from "@/services/household.service";
import { useAuthStore } from "@/stores/authStore";

export function HouseholdSwitcher() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data } = useQuery({
    queryKey: ["households"],
    queryFn: () => householdService.getHouseholds(),
    enabled: !!user,
  });

  const switchMutation = useMutation({
    mutationFn: (id: string) => householdService.switchHousehold(id),
    onSuccess: () => {
      qc.invalidateQueries();
      navigate("/overview");
    },
  });

  const households = data?.households ?? [];
  const activeId = user?.activeHouseholdId;

  if (households.length <= 1) {
    const name = households[0]?.household?.name ?? "My household";
    return (
      <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{name}</span>
    );
  }

  return (
    <select
      className="text-sm bg-transparent border-none outline-none cursor-pointer font-medium max-w-[160px] truncate"
      value={activeId ?? ""}
      onChange={(e) => switchMutation.mutate(e.target.value)}
    >
      {households.map(({ household }) => (
        <option key={household.id} value={household.id}>
          {household.name}
        </option>
      ))}
    </select>
  );
}
