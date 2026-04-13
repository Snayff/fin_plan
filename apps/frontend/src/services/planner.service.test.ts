import { describe, it, expect } from "bun:test";

describe("plannerService gift removal", () => {
  it("no longer exposes gift methods", async () => {
    const { plannerService } = await import("./planner.service");
    expect((plannerService as any).listGiftPersons).toBeUndefined();
    expect((plannerService as any).getGiftPerson).toBeUndefined();
    expect((plannerService as any).createGiftPerson).toBeUndefined();
    expect((plannerService as any).updateGiftPerson).toBeUndefined();
    expect((plannerService as any).deleteGiftPerson).toBeUndefined();
    expect((plannerService as any).createGiftEvent).toBeUndefined();
    expect((plannerService as any).updateGiftEvent).toBeUndefined();
    expect((plannerService as any).deleteGiftEvent).toBeUndefined();
    expect((plannerService as any).upsertGiftYearRecord).toBeUndefined();
    expect((plannerService as any).getUpcomingGifts).toBeUndefined();
  });
});
