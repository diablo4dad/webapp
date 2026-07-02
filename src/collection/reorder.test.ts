import { describe, expect, test } from "vitest";
import { MasterGroup } from "../common";
import type { Collection, CollectionItem, DadDb } from "../data";
import {
  areCollectionOrdersEqual,
  areItemOrdersEqual,
  getCollectionListIds,
  moveCollectionIdToIndex,
  moveCollectionInDb,
  moveItemIdToIndex,
  reorderCollectionItemsInDb,
} from "./reorder";

function item(id: number): CollectionItem {
  return {
    claim: "",
    id,
    items: [],
  };
}

function collection(
  id: string,
  options: {
    category?: MasterGroup;
    collectionItems?: CollectionItem[];
    subcollections?: Collection[];
  } = {},
): Collection {
  return {
    id,
    name: id,
    category: options.category,
    collectionItems: options.collectionItems ?? [],
    subcollections: options.subcollections ?? [],
  };
}

function db(collections: Collection[]): DadDb {
  return {
    collections,
    items: [],
    itemTypes: [],
  };
}

describe("item order", () => {
  test("moves ids to a clamped index", () => {
    expect(moveItemIdToIndex([1, 2, 3], 2, 0)).toEqual([2, 1, 3]);
    expect(moveItemIdToIndex([1, 2, 3], 2, 99)).toEqual([1, 3, 2]);
    expect(moveItemIdToIndex([1, 2, 3], 2, -1)).toEqual([2, 1, 3]);
  });

  test("compares ordered item ids", () => {
    expect(areItemOrdersEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(areItemOrdersEqual([1, 2, 3], [1, 3, 2])).toBe(false);
    expect(areItemOrdersEqual([1, 2, 3], [1, 2])).toBe(false);
  });

  test("reorders items in a nested collection", () => {
    const source = db([
      collection("root", {
        subcollections: [
          collection("nested", {
            collectionItems: [item(101), item(102), item(103)],
          }),
        ],
      }),
    ]);

    expect(
      reorderCollectionItemsInDb(source, "nested", [103, 101, 102])
        .collections[0].subcollections[0].collectionItems.map(
          (collectionItem) => collectionItem.id,
        ),
    ).toEqual([103, 101, 102]);
  });

  test("returns the original db when the collection is missing", () => {
    const source = db([collection("root", { collectionItems: [item(101)] })]);

    expect(reorderCollectionItemsInDb(source, "missing", [101])).toBe(source);
  });
});

describe("collection order", () => {
  test("moves ids to a clamped index", () => {
    expect(moveCollectionIdToIndex(["a", "b", "c"], "b", 0)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(moveCollectionIdToIndex(["a", "b", "c"], "b", 99)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  test("compares ordered collection ids", () => {
    expect(areCollectionOrdersEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(areCollectionOrdersEqual(["a", "b"], ["b", "a"])).toBe(false);
    expect(areCollectionOrdersEqual(["a", "b"], ["a"])).toBe(false);
  });

  test("lists collection ids", () => {
    expect(getCollectionListIds([collection("a"), collection("b")])).toEqual([
      "a",
      "b",
    ]);
  });

  test("reorders root collections within a category", () => {
    const source = db([
      collection("general-a", { category: MasterGroup.GENERAL }),
      collection("shop", { category: MasterGroup.SHOP_ITEMS }),
      collection("general-b", { category: MasterGroup.GENERAL }),
    ]);

    expect(
      moveCollectionInDb(
        source,
        "general-b",
        null,
        ["general-b", "general-a"],
        MasterGroup.GENERAL,
      ).collections.map((candidate) => candidate.id),
    ).toEqual(["general-b", "general-a", "shop"]);
  });

  test("moves a root collection into a parent", () => {
    const source = db([
      collection("parent", {
        category: MasterGroup.GENERAL,
        subcollections: [collection("child-a")],
      }),
      collection("child-b", { category: MasterGroup.GENERAL }),
    ]);

    const result = moveCollectionInDb(
      source,
      "child-b",
      "parent",
      ["child-a", "child-b"],
      MasterGroup.GENERAL,
    );

    expect(result.collections.map((candidate) => candidate.id)).toEqual([
      "parent",
    ]);
    expect(result.collections[0].subcollections.map((candidate) => candidate.id))
      .toEqual(["child-a", "child-b"]);
    expect(result.collections[0].subcollections[1].category).toBeUndefined();
  });

  test("moves a subcollection to category roots", () => {
    const source = db([
      collection("parent", {
        category: MasterGroup.GENERAL,
        subcollections: [collection("child")],
      }),
      collection("root", { category: MasterGroup.GENERAL }),
    ]);

    const result = moveCollectionInDb(
      source,
      "child",
      null,
      ["child", "parent", "root"],
      MasterGroup.GENERAL,
    );

    expect(result.collections.map((candidate) => candidate.id)).toEqual([
      "child",
      "parent",
      "root",
    ]);
    expect(result.collections[0].category).toBe(MasterGroup.GENERAL);
    expect(result.collections[1].subcollections).toEqual([]);
  });

  test("returns the original db when the collection is missing", () => {
    const source = db([collection("root", { category: MasterGroup.GENERAL })]);

    expect(
      moveCollectionInDb(
        source,
        "missing",
        null,
        ["root"],
        MasterGroup.GENERAL,
      ),
    ).toBe(source);
  });
});
