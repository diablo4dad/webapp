import { describe, expect, test } from "vitest";
import type { CollectionLog } from "../ledger/type";
import { hashCode } from "../../shared/lib/hash";
import { MasterGroup } from "../../shared/domain";
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
  category?: MasterGroup,
): Collection {
  return {
    category,
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

  test("returns grand totals", () => {
    const helm = collectionItem(101, "Helm");
    const mount = collectionItem(102, "Mount");
    const pet = collectionItem(103, "Pet");
    const general = collection([helm, mount], [], MasterGroup.GENERAL);
    const season = collection([pet], [], MasterGroup.SEASONS);

    const model = getProgressViewModel(
      log([[101], [102]]),
      [general, season],
    );

    expect(model.grandTotal).toMatchObject({
      collected: 2,
      percent: 66.66666666666666,
      remaining: 1,
      title: "Grand Total",
      total: 3,
    });
    expect(model.selectedScope).toMatchObject({
      collected: 2,
      id: "current",
      positionLabel: "1 of 1",
      title: "Grand Total",
      total: 3,
    });
  });

  test("returns selected carousel scope with scoped totals", () => {
    const helm = collectionItem(101, "Helm");
    const mount = collectionItem(102, "Mount");
    const pet = collectionItem(103, "Pet");
    const general = collection([helm, mount], [], MasterGroup.GENERAL);
    const season = collection([pet], [], MasterGroup.SEASONS);

    const model = getProgressViewModel(
      log([[101], [102]]),
      [season],
      {
        scopeSources: [
          {
            collections: [general, season],
            id: "everything",
            title: "Everything",
          },
          {
            collections: [season],
            iconSrc: "/season-icon.webp",
            id: MasterGroup.SEASONS,
            title: "Seasons",
          },
        ],
        selectedScopeId: MasterGroup.SEASONS,
      },
    );

    expect(model.selectedScope).toMatchObject({
      collected: 0,
      iconSrc: "/season-icon.webp",
      id: MasterGroup.SEASONS,
      percent: 0,
      positionLabel: "2 of 2",
      remaining: 1,
      title: "Seasons",
      total: 1,
    });
    expect(model.grandTotal).toMatchObject({
      collected: 0,
      percent: 0,
      remaining: 1,
      total: 1,
    });
  });
});
