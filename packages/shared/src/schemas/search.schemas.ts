import { z } from "zod";

export const SearchResultKindEnum = z.enum([
  "income_source",
  "committed_item",
  "discretionary_item",
  "asset",
  "account",
  "gift_person",
  "gift_event",
  "purchase_item",
]);

export type SearchResultKind = z.infer<typeof SearchResultKindEnum>;

export const SearchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100),
  })
  .strict();

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SearchResultSchema = z
  .object({
    kind: SearchResultKindEnum,
    id: z.string(),
    name: z.string(),
    subtitle: z.string(),
    route: z.string(),
    focusId: z.string(),
  })
  .strict();

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchResponseSchema = z
  .object({
    results: z.array(SearchResultSchema),
  })
  .strict();

export type SearchResponse = z.infer<typeof SearchResponseSchema>;
