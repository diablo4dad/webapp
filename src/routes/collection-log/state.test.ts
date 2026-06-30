import { setCollectionOpen, type CollectionLogViewModel } from "./state";

describe("collection log view model state", () => {
  test("opens a collection", () => {
    const viewModel: CollectionLogViewModel = {
      openCollections: ["general-001", "season-002", "challenge-003"],
    };

    expect(setCollectionOpen(viewModel, "shop-004", true)).toEqual({
      openCollections: [
        "general-001",
        "season-002",
        "challenge-003",
        "shop-004",
      ],
    });
  });

  test("does not duplicate an already open collection", () => {
    const viewModel: CollectionLogViewModel = {
      openCollections: [
        "general-001",
        "season-002",
        "challenge-003",
        "shop-004",
      ],
    };

    expect(setCollectionOpen(viewModel, "season-002", true)).toEqual({
      openCollections: [
        "general-001",
        "season-002",
        "challenge-003",
        "shop-004",
      ],
    });
  });

  test("closes a collection", () => {
    const viewModel: CollectionLogViewModel = {
      openCollections: [
        "general-001",
        "season-002",
        "challenge-003",
        "shop-004",
        "promo-005",
      ],
    };

    expect(setCollectionOpen(viewModel, "challenge-003", false)).toEqual({
      openCollections: ["general-001", "season-002", "shop-004", "promo-005"],
    });
  });

  test("leaves state unchanged when closing a collection that is not open", () => {
    const viewModel: CollectionLogViewModel = {
      openCollections: ["general-001", "season-002", "shop-004"],
    };

    expect(setCollectionOpen(viewModel, "promo-005", false)).toEqual({
      openCollections: ["general-001", "season-002", "shop-004"],
    });
  });
});
