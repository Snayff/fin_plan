import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { SearchPalette } from "../SearchPalette";

function renderPalette(open = true, onOpenChange = () => {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/overview"]}>
        <SearchPalette open={open} onOpenChange={onOpenChange} userId="u-1" />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SearchPalette", () => {
  it("renders the input when open", () => {
    server.use(
      http.get("http://localhost:3001/api/search", () => HttpResponse.json({ results: [] }))
    );
    renderPalette(true);
    // cmdk renders Command.Input as role="combobox"
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows 'No results' when a non-empty query yields nothing", async () => {
    server.use(
      http.get("http://localhost:3001/api/search", () => HttpResponse.json({ results: [] }))
    );
    const user = userEvent.setup();
    renderPalette(true);
    await user.type(screen.getByRole("combobox"), "zzz-no-match");
    expect(await screen.findByText(/No results/i)).toBeInTheDocument();
  });
});
