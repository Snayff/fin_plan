import { describe, it, expect, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const mockSubcategories = [
  {
    id: "sub-salary",
    householdId: "hh-1",
    tier: "income",
    name: "Salary",
    sortOrder: 0,
    isLocked: false,
    isDefault: true,
  },
  {
    id: "sub-div",
    householdId: "hh-1",
    tier: "income",
    name: "Dividends",
    sortOrder: 1,
    isLocked: false,
    isDefault: true,
  },
  {
    id: "sub-other",
    householdId: "hh-1",
    tier: "income",
    name: "Other",
    sortOrder: 2,
    isLocked: false,
    isDefault: true,
  },
];

mock.module("@/services/waterfall.service", () => ({
  waterfallService: {
    getSubcategories: mock(async () => mockSubcategories),
    getSubcategoryCounts: mock(async () => ({ "sub-salary": 2, "sub-div": 1 })),
    saveSubcategories: mock(async () => mockSubcategories),
    resetSubcategories: mock(async () => ({ success: true })),
  },
}));

mock.module("@/stores/authStore", () => {
  const fn = mock((selector: any) => selector({ user: { id: "u1", activeHouseholdId: "hh-1" } }));
  (fn as any).setState = mock(() => {});
  (fn as any).getState = mock(() => ({
    user: { id: "u1", activeHouseholdId: "hh-1" },
  }));
  return { useAuthStore: fn };
});

// Mock dnd-kit to avoid complex DnD setup in tests
mock.module("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => createElement("div", null, children),
  closestCenter: () => {},
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: () => [],
}));

mock.module("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => createElement("div", null, children),
  sortableKeyboardCoordinates: () => {},
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

mock.module("@dnd-kit/modifiers", () => ({
  restrictToVerticalAxis: {},
}));

mock.module("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

mock.module("sonner", () => ({
  toast: { success: mock(() => {}), error: mock(() => {}) },
}));

const { SubcategoriesSection } = await import("./SubcategoriesSection");

function wrapper({ children }: { children: any }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe("SubcategoriesSection", () => {
  it("renders three tier tabs", async () => {
    render(createElement(SubcategoriesSection), { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /income/i })).toBeDefined();
      expect(screen.getByRole("tab", { name: /committed/i })).toBeDefined();
      expect(screen.getByRole("tab", { name: /discretionary/i })).toBeDefined();
    });
  });

  it("shows subcategory rows for the active tab", async () => {
    render(createElement(SubcategoriesSection), { wrapper });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Salary")).toBeDefined();
      expect(screen.getByDisplayValue("Dividends")).toBeDefined();
      expect(screen.getByDisplayValue("Other")).toBeDefined();
    });
  });

  it("shows capacity indicator", async () => {
    render(createElement(SubcategoriesSection), { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/3 of 7/)).toBeDefined();
    });
  });

  it("disables Save button when no changes", async () => {
    render(createElement(SubcategoriesSection), { wrapper });
    await waitFor(() => {
      const saveBtn = screen.getByRole("button", { name: /save/i });
      expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
