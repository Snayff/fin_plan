import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { useSubcategories } from "@/hooks/useWaterfall";
import {
  useSubcategoryCounts,
  useSaveSubcategories,
  useResetSubcategories,
} from "@/hooks/useSubcategorySettings";
import { SubcategoryRow } from "./SubcategoryRow";
import { ReassignmentPrompt } from "./ReassignmentPrompt";
import { ResetConfirmationModal } from "./ResetConfirmationModal";
import { Section } from "./Section";
import { TIER_CONFIGS, type TierKey } from "@/components/tier/tierConfig";
import type { SubcategoryRow as SubcategoryRowType, WaterfallTier } from "@finplan/shared";

const TIERS: TierKey[] = ["income", "committed", "discretionary"];
const MAX_PER_TIER = 7;

const DEFAULT_NAMES: Record<TierKey, string[]> = {
  income: ["Salary", "Dividends", "Other"],
  committed: ["Housing", "Utilities", "Services", "Charity", "Childcare", "Vehicles", "Other"],
  discretionary: ["Food", "Fun", "Clothes", "Gifts", "Savings", "Other"],
};

interface DraftSub {
  id?: string;
  name: string;
  sortOrder: number;
  isLocked: boolean;
  isOther: boolean;
  isDefault: boolean;
  tempId: string;
}

function toDraft(row: SubcategoryRowType): DraftSub {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    isLocked: row.isLocked,
    isOther: row.name === "Other",
    isDefault: row.isDefault,
    tempId: row.id,
  };
}

let tempCounter = 0;

export function SubcategoriesSection() {
  const [activeTier, setActiveTier] = useState<TierKey>("income");
  const [drafts, setDrafts] = useState<Record<TierKey, DraftSub[] | null>>({
    income: null,
    committed: null,
    discretionary: null,
  });
  const [reassignments, setReassignments] = useState<
    Record<TierKey, Array<{ fromSubcategoryId: string; toSubcategoryId: string }>>
  >({ income: [], committed: [], discretionary: [] });
  const [pendingRemoval, setPendingRemoval] = useState<{
    sub: DraftSub;
    tier: TierKey;
  } | null>(null);
  const [showReset, setShowReset] = useState(false);

  const incomeQuery = useSubcategories("income");
  const committedQuery = useSubcategories("committed");
  const discretionaryQuery = useSubcategories("discretionary");
  const queries: Record<TierKey, typeof incomeQuery> = {
    income: incomeQuery,
    committed: committedQuery,
    discretionary: discretionaryQuery,
  };

  const countsQuery = useSubcategoryCounts(activeTier);
  const incomeCountsQuery = useSubcategoryCounts("income");
  const committedCountsQuery = useSubcategoryCounts("committed");
  const discretionaryCountsQuery = useSubcategoryCounts("discretionary");
  const allCounts: Record<TierKey, Record<string, number>> = {
    income: incomeCountsQuery.data ?? {},
    committed: committedCountsQuery.data ?? {},
    discretionary: discretionaryCountsQuery.data ?? {},
  };
  const saveMutation = useSaveSubcategories();
  const resetMutation = useResetSubcategories();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const serverSubs = queries[activeTier].data ?? [];
  const currentDraft = drafts[activeTier] ?? serverSubs.map(toDraft);
  const itemCounts = countsQuery.data ?? {};

  const sortableItems = currentDraft.filter((s) => !s.isOther);
  const otherItem = currentDraft.find((s) => s.isOther);

  const hasChanges = useMemo(() => {
    for (const tier of TIERS) {
      if (drafts[tier] !== null) return true;
      if (reassignments[tier].length > 0) return true;
    }
    return false;
  }, [drafts, reassignments]);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    const names = currentDraft.map((s) => s.name.toLowerCase().trim());
    currentDraft.forEach((s, i) => {
      const trimmed = s.name.trim();
      if (!trimmed) {
        errs[s.tempId] = "Name cannot be empty";
      } else if (!s.isOther && trimmed.toLowerCase() === "other") {
        errs[s.tempId] = "'Other' is reserved";
      } else if (names.indexOf(trimmed.toLowerCase()) !== i) {
        errs[s.tempId] = "Duplicate name";
      }
    });
    return errs;
  }, [currentDraft]);

  const hasErrors = Object.keys(errors).length > 0;

  function updateDraft(tier: TierKey, updater: (prev: DraftSub[]) => DraftSub[]) {
    setDrafts((prev) => {
      const current = prev[tier] ?? (queries[tier].data ?? []).map(toDraft);
      return { ...prev, [tier]: updater(current) };
    });
  }

  function handleNameChange(tempId: string, name: string) {
    updateDraft(activeTier, (prev) => prev.map((s) => (s.tempId === tempId ? { ...s, name } : s)));
  }

  function handleRemove(sub: DraftSub) {
    if (!sub.id) {
      updateDraft(activeTier, (prev) => prev.filter((s) => s.tempId !== sub.tempId));
      return;
    }
    const count = itemCounts[sub.id] ?? 0;
    if (count > 0) {
      setPendingRemoval({ sub, tier: activeTier });
    } else {
      updateDraft(activeTier, (prev) => prev.filter((s) => s.tempId !== sub.tempId));
    }
  }

  function handleReassignmentConfirm(destinationId: string) {
    if (!pendingRemoval) return;
    const { sub, tier } = pendingRemoval;
    setReassignments((prev) => ({
      ...prev,
      [tier]: [...prev[tier], { fromSubcategoryId: sub.id!, toSubcategoryId: destinationId }],
    }));
    updateDraft(tier, (prev) => prev.filter((s) => s.tempId !== sub.tempId));
    setPendingRemoval(null);
  }

  function handleAdd() {
    if (currentDraft.length >= MAX_PER_TIER) return;
    tempCounter++;
    const newSub: DraftSub = {
      name: "",
      sortOrder: currentDraft.length - 1,
      isLocked: false,
      isOther: false,
      isDefault: false,
      tempId: `new-${tempCounter}`,
    };
    updateDraft(activeTier, (prev) => {
      const withoutOther = prev.filter((s) => !s.isOther);
      const other = prev.find((s) => s.isOther);
      return [...withoutOther, newSub, ...(other ? [other] : [])];
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    updateDraft(activeTier, (prev) => {
      const withoutOther = prev.filter((s) => !s.isOther);
      const other = prev.find((s) => s.isOther);
      const oldIndex = withoutOther.findIndex((s) => s.tempId === active.id);
      const newIndex = withoutOther.findIndex((s) => s.tempId === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = [...withoutOther];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved!);

      return [
        ...reordered.map((s, i) => ({ ...s, sortOrder: i })),
        ...(other ? [{ ...other, sortOrder: reordered.length }] : []),
      ];
    });
  }

  function handleDiscard() {
    setDrafts({ income: null, committed: null, discretionary: null });
    setReassignments({ income: [], committed: [], discretionary: [] });
  }

  async function handleSave() {
    for (const tier of TIERS) {
      const draft = drafts[tier];
      if (!draft && reassignments[tier].length === 0) continue;

      const subs = (draft ?? (queries[tier].data ?? []).map(toDraft)).map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        name: s.name.trim(),
        sortOrder: s.sortOrder,
      }));

      try {
        await saveMutation.mutateAsync({
          tier,
          data: { subcategories: subs, reassignments: reassignments[tier] },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save subcategories";
        toast.error(message);
        return;
      }
    }
    toast.success("Subcategories updated");
    handleDiscard();
  }

  const handleResetConfirm = useCallback(
    async (resetReassignments: Array<{ fromSubcategoryId: string; toSubcategoryId: string }>) => {
      try {
        await resetMutation.mutateAsync({ reassignments: resetReassignments });
        toast.success("Subcategories reset to defaults");
        setShowReset(false);
        handleDiscard();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to reset subcategories";
        toast.error(message);
      }
    },
    [resetMutation]
  );

  /* eslint-disable react-hooks/exhaustive-deps -- deps are the individual .data properties */
  const allSubsForReset = useMemo(() => {
    const result: Array<{
      id: string;
      tier: WaterfallTier;
      name: string;
      itemCount: number;
    }> = [];
    for (const tier of TIERS) {
      const subs = queries[tier].data ?? [];
      const defaults = DEFAULT_NAMES[tier];
      for (const sub of subs) {
        if (!defaults.includes(sub.name)) {
          result.push({
            id: sub.id,
            tier,
            name: sub.name,
            itemCount: allCounts[tier][sub.id] ?? 0,
          });
        }
      }
    }
    return result;
  }, [queries.income.data, queries.committed.data, queries.discretionary.data]);

  const defaultDestinations = useMemo(() => {
    const result: Record<TierKey, Array<{ id: string; name: string }>> = {
      income: [],
      committed: [],
      discretionary: [],
    };
    for (const tier of TIERS) {
      const subs = queries[tier].data ?? [];
      const defaults = DEFAULT_NAMES[tier];
      for (const sub of subs) {
        if (defaults.includes(sub.name)) {
          result[tier].push({ id: sub.id, name: sub.name });
        }
      }
      if (result[tier].length === 0) {
        result[tier].push({ id: "", name: "Other" });
      }
    }
    return result;
  }, [queries.income.data, queries.committed.data, queries.discretionary.data]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const reassignmentDestinations = useMemo(() => {
    return currentDraft
      .filter(
        (s) =>
          s.tempId !== pendingRemoval?.sub.tempId &&
          !reassignments[activeTier].some((r) => r.fromSubcategoryId === s.id)
      )
      .map((s) => ({ id: s.id ?? s.tempId, name: s.name }));
  }, [currentDraft, pendingRemoval, reassignments, activeTier]);

  const isLoading = queries[activeTier].isLoading || countsQuery.isLoading;

  return (
    <Section id="subcategories" title="Subcategories">
      <p className="text-sm text-muted-foreground">
        Customise the subcategories for each waterfall tier. Changes are saved together.
      </p>

      <Tabs value={activeTier} onValueChange={(v) => setActiveTier(v as TierKey)}>
        <TabsList>
          {TIERS.map((tier) => (
            <TabsTrigger key={tier} value={tier} className={TIER_CONFIGS[tier].textClass}>
              {TIER_CONFIGS[tier].label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TIERS.map((tier) => (
          <TabsContent key={tier} value={tier}>
            {isLoading ? (
              <SkeletonLoader variant="right-panel" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  {currentDraft.length} of {MAX_PER_TIER} used
                </p>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortableItems.map((s) => s.tempId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortableItems.map((sub) => (
                      <SubcategoryRow
                        key={sub.tempId}
                        id={sub.tempId}
                        name={sub.name}
                        isLocked={sub.isLocked}
                        isOther={false}
                        error={errors[sub.tempId]}
                        onNameChange={(name) => handleNameChange(sub.tempId, name)}
                        onRemove={() => handleRemove(sub)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {otherItem && (
                  <SubcategoryRow
                    id={otherItem.tempId}
                    name={otherItem.name}
                    isLocked={false}
                    isOther={true}
                    onNameChange={() => {}}
                    onRemove={() => {}}
                  />
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={currentDraft.length >= MAX_PER_TIER}
                  onClick={handleAdd}
                >
                  Add subcategory
                </Button>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || hasErrors || saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDiscard} disabled={!hasChanges}>
          Discard changes
        </Button>
      </div>

      <div className="mt-6 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReset(true)}
          className="text-muted-foreground"
        >
          Reset to defaults
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Restores all tiers to the original subcategory set. Items will be reassigned.
        </p>
      </div>

      {pendingRemoval && (
        <ReassignmentPrompt
          isOpen={true}
          subcategoryName={pendingRemoval.sub.name}
          itemCount={itemCounts[pendingRemoval.sub.id!] ?? 0}
          destinations={reassignmentDestinations}
          onConfirm={handleReassignmentConfirm}
          onCancel={() => setPendingRemoval(null)}
        />
      )}

      <ResetConfirmationModal
        isOpen={showReset}
        nonDefaultSubs={allSubsForReset}
        defaultDestinations={defaultDestinations}
        onConfirm={handleResetConfirm}
        onCancel={() => setShowReset(false)}
        isLoading={resetMutation.isPending}
      />
    </Section>
  );
}
