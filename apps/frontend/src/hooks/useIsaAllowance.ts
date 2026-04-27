import { useQuery } from "@tanstack/react-query";
import { getIsaAllowance } from "@/services/assets.service";

export const ISA_ALLOWANCE_KEY = ["isa-allowance"] as const;

export function useIsaAllowance() {
  return useQuery({
    queryKey: ISA_ALLOWANCE_KEY,
    queryFn: getIsaAllowance,
    staleTime: 60 * 1000,
  });
}
