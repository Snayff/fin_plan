import { describe, it, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/helpers/render";
import { server } from "@/test/msw/server";
import { LinkedAccountsPopover } from "./LinkedAccountsPopover";
import { fireEvent, screen, waitFor } from "@testing-library/react";

describe("LinkedAccountsPopover", () => {
  it("lists linked accounts returned by the API", async () => {
    server.use(
      http.get("/api/cashflow/linkable-accounts", () =>
        HttpResponse.json([
          {
            id: "a1",
            name: "Joint Current",
            type: "Current",
            isCashflowLinked: true,
            latestBalance: 4200,
            latestBalanceDate: "2026-04-01",
          },
        ])
      )
    );
    renderWithProviders(<LinkedAccountsPopover onClose={() => {}} />);
    expect(await screen.findByText(/joint current/i)).toBeTruthy();
  });

  it("toggles isCashflowLinked when checkbox clicked", async () => {
    let receivedUpdates: any = null;
    server.use(
      http.get("/api/cashflow/linkable-accounts", () =>
        HttpResponse.json([
          {
            id: "a1",
            name: "Joint Current",
            type: "Current",
            isCashflowLinked: false,
            latestBalance: 4200,
            latestBalanceDate: "2026-04-01",
          },
        ])
      ),
      http.post("/api/cashflow/linkable-accounts/bulk", async ({ request }) => {
        receivedUpdates = await request.json();
        return HttpResponse.json([]);
      })
    );
    renderWithProviders(<LinkedAccountsPopover onClose={() => {}} />);
    const checkbox = await screen.findByRole("checkbox", { name: /joint current/i });
    fireEvent.click(checkbox);
    await waitFor(() => expect(receivedUpdates).not.toBeNull());
    expect(receivedUpdates.updates).toEqual([{ accountId: "a1", isCashflowLinked: true }]);
  });
});
