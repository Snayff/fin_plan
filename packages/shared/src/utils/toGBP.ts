/**
 * Round a number to exactly 2 decimal places (GBP precision).
 *
 * This is an interim measure to control floating-point drift while
 * the full pence-integer arithmetic migration is pending.
 * See: docs/4. planning/_future/pence-integer-arithmetic/
 */
export function toGBP(n: number): number {
  return (Math.sign(n) * Math.round(Math.abs(n) * 100)) / 100;
}
