import { act, renderHook } from "@testing-library/react";
import {
  getCollectionLogViewModel,
  saveCollectionLogViewModel,
} from "../../store/local";
import {
  setCollectionOpen,
  type CollectionLogViewModel,
  useCollectionLogState,
} from "./state";

beforeEach(() => {
  localStorage.clear();
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
