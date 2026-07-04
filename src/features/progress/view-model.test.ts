import { describe, expect, test } from "vitest";
import type { CollectionLog } from "../ledger/type";
import { hashCode } from "../../shared/lib/hash";
import type {
  Collection,
  CollectionGroup,
  CollectionItem,
  Item,
} from "../../services/data";
import { getProgressViewModel } from "./view-model";

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

describe("progress view model", () => {
  test("returns configured cards with collection stats", () => {
    const helm = collectionItem(101, "Helm");
    const sword = collectionItem(102, "Sword");
    const pet = collectionItem(103, "Pet");
    const collections: CollectionGroup = [
      collection([helm, pet], [collection([sword])]),
    ];

    const model = getProgressViewModel(log([[101], [102]]), collections);

    expect(model.cards.map((card) => card.title)).toEqual([
      "Armor & Weapons",
      "Mounts, Armor & Trophies",
      "Town Portals & Headstones",
      "Back Trophies",
      "Pets",
      "Other",
    ]);
    expect(model.cards[0]).toMatchObject({
      title: "Armor & Weapons",
      collected: 2,
      isComplete: true,
      percent: 100,
      total: 2,
    });
    expect(model.cards[4]).toMatchObject({
      title: "Pets",
      collected: 0,
      isComplete: false,
      percent: 0,
      total: 1,
    });
  });
});
