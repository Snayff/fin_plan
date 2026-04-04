import { useAnimatedValue } from "@/hooks/useAnimatedValue";
import { formatCurrency } from "@/utils/format";
import { useSettings } from "@/hooks/useSettings";

interface AnimatedCurrencyProps {
  value: number;
}

/**
 * Renders a currency value that lerps smoothly when changed.
 * Drop-in replacement for `formatCurrency(value)` in JSX.
 */
export function AnimatedCurrency({ value }: AnimatedCurrencyProps) {
  const { data: settings } = useSettings();
  const showPence = settings?.showPence ?? false;
  const display = useAnimatedValue(value, showPence ? 2 : 0);
  return <>{formatCurrency(display, showPence)}</>;
}
