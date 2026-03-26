import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { formatCurrency } from "@/utils/format";

interface AnimatedCurrencyProps {
  value: number;
}

/**
 * Renders a currency value that lerps smoothly when changed.
 * Drop-in replacement for `formatCurrency(value)` in JSX.
 */
export function AnimatedCurrency({ value }: AnimatedCurrencyProps) {
  const display = useAnimatedValue(value);
  return <>{formatCurrency(display)}</>;
}
