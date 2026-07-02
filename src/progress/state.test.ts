import { describe, expect, test } from "vitest";
import type { CollectionLog } from "../collection/type";
import { ItemGroup } from "../common";
import { hashCode } from "../common/hash";
import type { Collection, CollectionGroup, CollectionItem, Item } from "../data";
import { getProgressStats } from "./state";

function item(id: number, itemTypeName: string): Item {
  return {
    id,
    icon: "",
    invImages: [],
    itemType: {
      id,
      name: itemTypeName,
    },
    name: `Item ${id}`,
    similarItems: [],
    similarItemsRefs: [],
    usableByClass: [],
  };
}

function collectionItem(id: number, itemTypeName: string): CollectionItem {
  return {
    id,
    claim: "",
    items: [item(id, itemTypeName)],
  };
}

function collection(
  collectionItems: CollectionItem[],
  subcollections: Collection[] = [],
): Collection {
  return {
    id: String(collectionItems[0]?.id ?? "empty"),
    name: "Collection",
    collectionItems,
    subcollections,
  };
}

function log(collectedItemIds: number[][] = []): CollectionLog {
  return {
    collected: collectedItemIds.map(hashCode),
    hidden: [],
  };
}

describe("progress stats", () => {
  test("counts matching collected items", () => {
    const helm = collectionItem(101, "Helm");
    const sword = collectionItem(102, "Sword");
    const mount = collectionItem(103, "Mount");
    const collections: CollectionGroup = [collection([helm, mount], [collection([sword])])];

    expect(
      getProgressStats(log([[101], [102]]), collections, [
        ItemGroup.ARMOR,
        ItemGroup.WEAPONS,
      ]),
    ).toEqual({
      collected: 2,
      isComplete: true,
      percent: 100,
      total: 2,
    });
  });

  test("ignores item types outside the selected groups", () => {
    const collections: CollectionGroup = [
      collection([collectionItem(101, "Helm"), collectionItem(102, "Mount")]),
    ];

    expect(getProgressStats(log([[101], [102]]), collections, [ItemGroup.ARMOR]))
      .toEqual({
        collected: 1,
        isComplete: true,
        percent: 100,
        total: 1,
      });
  });

  test("returns zero progress when no items match", () => {
    const collections: CollectionGroup = [collection([collectionItem(101, "Mount")])];

    expect(getProgressStats(log([[101]]), collections, [ItemGroup.PETS]))
      .toEqual({
        collected: 0,
        isComplete: false,
        percent: 0,
        total: 0,
      });
  });
});
