import { createListingSchema } from "./schemas";

describe("createListingSchema", () => {
  it("should validate a correct listing", () => {
    const listing = {
      kind: "OFFER",
      title: "Test Listing",
      description: "This is a test listing.",
      categories: ["test"],
      priceType: "BARTER",
      creditPrice: 10,
      preferredMeet: "REMOTE",
      visibility: "PUBLIC",
    };
    const result = createListingSchema.safeParse(listing);
    expect(result.success).toBe(true);
  });

  it("should invalidate a listing with a missing title", () => {
    const listing = {
      kind: "OFFER",
      description: "This is a test listing.",
      categories: ["test"],
      priceType: "BARTER",
      creditPrice: 10,
      preferredMeet: "REMOTE",
      visibility: "PUBLIC",
    };
    const result = createListingSchema.safeParse(listing);
    expect(result.success).toBe(false);
  });
});