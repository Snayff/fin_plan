import { prisma } from "../config/database.js";
import type { SearchResponse, SearchResult, SearchResultKind } from "@finplan/shared";

const PER_KIND_LIMIT = 5;

type NamedRow = { id: string; name: string };

type KindConfig = {
  kind: SearchResultKind;
  subtitle: string;
  route: string;
  fetch: (householdId: string, q: string) => Promise<NamedRow[]>;
};

function like(householdId: string, q: string) {
  return {
    where: {
      householdId,
      name: { contains: q, mode: "insensitive" as const },
    },
    select: { id: true, name: true },
    take: PER_KIND_LIMIT * 4,
  };
}

const KINDS: KindConfig[] = [
  {
    kind: "income_source",
    subtitle: "Income · Source",
    route: "/income",
    fetch: (h, q) => prisma.incomeSource.findMany(like(h, q)),
  },
  {
    kind: "committed_item",
    subtitle: "Committed · Item",
    route: "/committed",
    fetch: (h, q) => prisma.committedItem.findMany(like(h, q)),
  },
  {
    kind: "discretionary_item",
    subtitle: "Discretionary · Item",
    route: "/discretionary",
    fetch: (h, q) => prisma.discretionaryItem.findMany(like(h, q)),
  },
  {
    kind: "asset",
    subtitle: "Wealth · Asset",
    route: "/assets",
    fetch: (h, q) => prisma.asset.findMany(like(h, q)),
  },
  {
    kind: "account",
    subtitle: "Wealth · Account",
    route: "/assets",
    fetch: (h, q) => prisma.account.findMany(like(h, q)),
  },
  {
    kind: "gift_person",
    subtitle: "Gifts · Person",
    route: "/gifts",
    fetch: (h, q) => prisma.giftPerson.findMany(like(h, q)),
  },
  {
    kind: "gift_event",
    subtitle: "Gifts · Event",
    route: "/gifts",
    fetch: (h, q) => prisma.giftEvent.findMany(like(h, q)),
  },
  {
    kind: "purchase_item",
    subtitle: "Goals · Purchase item",
    route: "/goals",
    fetch: (h, q) => prisma.purchaseItem.findMany(like(h, q)),
  },
];

function rankScore(name: string, q: string): number {
  const n = name.toLowerCase();
  const t = q.toLowerCase();
  if (n === t) return 0;
  if (n.startsWith(t)) return 1;
  return 2;
}

export const searchService = {
  async search(householdId: string, rawQuery: string): Promise<SearchResponse> {
    const q = rawQuery.trim();
    if (q.length === 0) return { results: [] };

    const buckets = await Promise.all(
      KINDS.map(async (cfg) => {
        const rows = await cfg.fetch(householdId, q);
        return rows
          .slice()
          .sort((a, b) => {
            const sa = rankScore(a.name, q);
            const sb = rankScore(b.name, q);
            if (sa !== sb) return sa - sb;
            return a.name.localeCompare(b.name);
          })
          .slice(0, PER_KIND_LIMIT)
          .map<SearchResult>((row) => ({
            kind: cfg.kind,
            id: row.id,
            name: row.name,
            subtitle: cfg.subtitle,
            route: cfg.route,
            focusId: row.id,
          }));
      })
    );

    return { results: buckets.flat() };
  },
};
