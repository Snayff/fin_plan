import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Command } from "cmdk";
import { SearchResultRow } from "../SearchResultRow";

describe("SearchResultRow", () => {
  it("renders title and subtitle", () => {
    render(
      <Command>
        <SearchResultRow title="Mortgage" subtitle="Committed · Item" onSelect={() => {}} />
      </Command>
    );
    expect(screen.getByText("Mortgage")).toBeInTheDocument();
    expect(screen.getByText("Committed · Item")).toBeInTheDocument();
  });
});
