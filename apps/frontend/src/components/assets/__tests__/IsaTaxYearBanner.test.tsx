import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { IsaTaxYearBanner } from "../IsaTaxYearBanner";

describe("IsaTaxYearBanner", () => {
  const account = {
    id: "a1",
    type: "Savings" as const,
    isISA: true,
    isaYearContribution: 12000,
    updatedAt: "2026-03-15T10:00:00Z",
    memberId: "m1",
  };

  it("renders the banner when conditions are met", () => {
    render(
      <IsaTaxYearBanner
        account={account}
        today={new Date("2026-04-10")}
        onZero={mock(() => {})}
        showPence={false}
      />
    );
    expect(screen.getByText(/new tax year began/i)).toBeInTheDocument();
    expect(screen.getByText(/£12,000/)).toBeInTheDocument();
  });

  it("does not render when isaYearContribution is 0", () => {
    const { container } = render(
      <IsaTaxYearBanner
        account={{ ...account, isaYearContribution: 0 }}
        today={new Date("2026-04-10")}
        onZero={mock(() => {})}
        showPence={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when account has been updated since 6 April", () => {
    const { container } = render(
      <IsaTaxYearBanner
        account={{ ...account, updatedAt: "2026-04-08T10:00:00Z" }}
        today={new Date("2026-04-10")}
        onZero={mock(() => {})}
        showPence={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render before 6 April", () => {
    const { container } = render(
      <IsaTaxYearBanner
        account={account}
        today={new Date("2026-04-03")}
        onZero={mock(() => {})}
        showPence={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render for a non-Savings account type", () => {
    const { container } = render(
      <IsaTaxYearBanner
        account={{ ...account, type: "Pension" as const }}
        today={new Date("2026-04-10")}
        onZero={mock(() => {})}
        showPence={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when isISA is false", () => {
    const { container } = render(
      <IsaTaxYearBanner
        account={{ ...account, isISA: false }}
        today={new Date("2026-04-10")}
        onZero={mock(() => {})}
        showPence={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("calls onZero when the action button is clicked", () => {
    const onZero = mock(() => {});
    render(
      <IsaTaxYearBanner
        account={account}
        today={new Date("2026-04-10")}
        onZero={onZero}
        showPence={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /zero this year's contribution/i }));
    expect(onZero).toHaveBeenCalled();
  });
});
