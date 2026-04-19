import { z } from "zod";

export const ForecastHorizonSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(10),
  z.literal(20),
  z.literal(30),
]);
export type ForecastHorizon = z.infer<typeof ForecastHorizonSchema>;

export const ForecastQuerySchema = z.object({
  horizonYears: z.coerce.number().pipe(ForecastHorizonSchema),
});
export type ForecastQuery = z.infer<typeof ForecastQuerySchema>;

export const NetWorthPointSchema = z.object({
  year: z.number().int(),
  nominal: z.number(),
  real: z.number(),
});
export type NetWorthPoint = z.infer<typeof NetWorthPointSchema>;

export const SurplusPointSchema = z.object({
  year: z.number().int(),
  cumulative: z.number(),
});
export type SurplusPoint = z.infer<typeof SurplusPointSchema>;

export const RetirementPointSchema = z.object({
  year: z.number().int(),
  pension: z.number(),
  savings: z.number(),
  stocksAndShares: z.number(),
});
export type RetirementPoint = z.infer<typeof RetirementPointSchema>;

export const RetirementMemberProjectionSchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  retirementYear: z.number().int().nullable(),
  series: z.array(RetirementPointSchema),
});
export type RetirementMemberProjection = z.infer<typeof RetirementMemberProjectionSchema>;

export const MonthlyContributionsByScopeSchema = z.object({
  netWorth: z.number(),
  retirement: z.number(),
});
export type MonthlyContributionsByScope = z.infer<typeof MonthlyContributionsByScopeSchema>;

export const ForecastProjectionSchema = z.object({
  netWorth: z.array(NetWorthPointSchema),
  surplus: z.array(SurplusPointSchema),
  retirement: z.array(RetirementMemberProjectionSchema),
  monthlyContributionsByScope: MonthlyContributionsByScopeSchema,
});
export type ForecastProjection = z.infer<typeof ForecastProjectionSchema>;
