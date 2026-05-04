import { useQuery } from "@tanstack/react-query";
import { getIsaAllowance } from "@/services/assets.service";
import { ISA_ALLOWANCE_KEY } from "./queryKeys.js";

export { ISA_ALLOWANCE_KEY };

export function useIsaAllowance() {
  return useQuery({
    queryKey: ISA_ALLOWANCE_KEY,
    queryFn: getIsaAllowance,
    staleTime: 60 * 1000,
  });
}
