import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubcategoryGroup } from "./SubcategoryGroup";

describe("SubcategoryGroup", () => {
  const subcategory = { id: "sub-1", name: "Housing", sortOrder: 0 };
  const items = [
    {
      id: "c-1",
      name: "Mortgage",
      amount: 1450,
      spendType: "monthly" as const,
      subcategoryId: "sub-1",
      notes: null,
      dueDate: null,
      lastReviewedAt: new Date(),
      createdAt: new Date(),
      sortOrder: 0,
    },
  ];

  it("renders subcategory name and group total", () => {
    render(
      <table>
        <tbody>
          <SubcategoryGroup
            tier="committed"
            subcategory={subcategory}
            items={items as any}
            members={[]}
            onAddDraft={() => {}}
            onDeleteItem={() => Promise.resolve()}
            onSaveName={() => Promise.resolve()}
            onSaveAmount={() => Promise.resolve()}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText(/£1,450/)).toBeInTheDocument();
  });

  it("renders + add ghost row at the end of items", () => {
    const onAddDraft = mock(() => {});
    render(
      <table>
        <tbody>
          <SubcategoryGroup
            tier="committed"
            subcategory={subcategory}
            items={items as any}
            members={[]}
            onAddDraft={onAddDraft}
            onDeleteItem={() => Promise.resolve()}
            onSaveName={() => Promise.resolve()}
            onSaveAmount={() => Promise.resolve()}
          />
        </tbody>
      </table>
    );
    const addBtn = screen.getByRole("button", { name: /\+ add/i });
    fireEvent.click(addBtn);
    expect(onAddDraft).toHaveBeenCalledWith("sub-1");
  });
});
