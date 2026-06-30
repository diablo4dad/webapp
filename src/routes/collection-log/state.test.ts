import { act, renderHook } from "@testing-library/react";
import {
  DEFAULT_COLLECTION_ITEM,
  type Collection,
  type CollectionItem,
} from "../../data";
import {
  getCollectionLogViewModel,
  saveCollectionLogViewModel,
} from "../../store/local";
import {
  getFocusState,
  setCollectionOpen,
  type CollectionLogViewModel,
  useCollectionLogState,
} from "./state";

beforeEach(() => {
  localStorage.clear();
});

function item(id: number): CollectionItem {
  return {
    claim: `claim-${id}`,
    id,
    items: [],
  };
}

function collection(
  id: string,
  collectionItems: CollectionItem[],
  subcollections: Collection[] = [],
): Collection {
  return {
    collectionItems,
    id,
    name: id,
    subcollections,
  };
}

describe("focus state", () => {
  const generalItem = item(101);
  const seasonItem = item(202);
  const seasonCollection = collection("season-002", [seasonItem]);
  const collections = [
    collection("general-001", [generalItem], [seasonCollection]),
  ];

  test("selects item and collection", () => {
    const focus = getFocusState({
      collections,
      focusCollectionId: "season-002",
      focusItemId: 202,
    });

    expect(focus.focusCollection).toBe(seasonCollection);
    expect(focus.focusItem).toBe(seasonItem);
    expect(focus.isItemSidebarLoading).toBe(false);
  });

  test("uses default item", () => {
    const focus = getFocusState({
      collections,
      focusCollectionId: "missing-003",
      focusItemId: 303,
    });

    expect(focus.focusCollection).toBeUndefined();
    expect(focus.focusItem).toBe(DEFAULT_COLLECTION_ITEM);
    expect(focus.isItemSidebarLoading).toBe(false);
  });

  test("marks empty focus", () => {
    const focus = getFocusState({
      collections,
      focusCollectionId: "general-001",
      focusItemId: -1,
    });

    expect(focus.isItemSidebarLoading).toBe(true);
  });
});

describe("view model state", () => {
  describe("opening", () => {
    test("adds the id", () => {
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

    test("does not duplicate ids", () => {
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
  });

  describe("closing", () => {
    test("removes the id", () => {
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
        openCollections: [
          "general-001",
          "season-002",
          "shop-004",
          "promo-005",
        ],
      });
    });

    test("does not change missing ids", () => {
      const viewModel: CollectionLogViewModel = {
        openCollections: ["general-001", "season-002", "shop-004"],
      };

      expect(setCollectionOpen(viewModel, "promo-005", false)).toEqual({
        openCollections: ["general-001", "season-002", "shop-004"],
      });
    });
  });
});

describe("persisted state", () => {
  test("loads open ids", () => {
    saveCollectionLogViewModel({
      openCollections: ["general-001", "season-002", "challenge-003"],
    });

    const { result } = renderHook(() => useCollectionLogState());

    expect(result.current.openCollections).toEqual([
      "general-001",
      "season-002",
      "challenge-003",
    ]);
  });

  test("saves open ids", () => {
    const { result } = renderHook(() => useCollectionLogState());

    act(() => {
      result.current.setOpenCollection("general-001", true);
      result.current.setOpenCollection("season-002", true);
      result.current.setOpenCollection("challenge-003", true);
    });

    expect(getCollectionLogViewModel()).toEqual({
      openCollections: ["general-001", "season-002", "challenge-003"],
    });
  });
});
