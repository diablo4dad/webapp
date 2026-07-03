import { describe, expect, test } from "vitest";
import { MasterGroup } from "../../shared/domain";
import { hashCode } from "../../shared/lib/hash";
import {
  MagicType,
  type Collection,
  type CollectionItem,
  type Item,
} from "../../services/data";
import { getLedgerGroupState } from "./ledger-group-state";
import type { CollectionLog } from "./type";

function item(id: number): Item {
  return {
    id,
    icon: `icons/${id}.webp`,
    invImages: [],
    itemType: {
      id: 1,
      name: "Armor",
    },
    magicType: MagicType.UNIQUE,
    name: `Item ${id}`,
    similarItemsRefs: [],
    usableByClass: [],
  };
}

function collectionItem(id: number): CollectionItem {
  return {
    claim: "Drop",
    id,
    items: [item(id)],
  };
}

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    category: MasterGroup.GENERAL,
    id: "alpha",
    name: "Alpha",
    collectionItems: [],
    subcollections: [],
    ...overrides,
  };
}

function log(overrides: Partial<CollectionLog> = {}): CollectionLog {
  return {
    collected: [],
    hidden: [],
    ...overrides,
  };
}

describe("ledger group state", () => {
  test("counts collected visible items", () => {
    const targetCollection = collection({
      collectionItems: [
        collectionItem(1),
        collectionItem(2),
        collectionItem(3),
      ],
    });

    expect(
      getLedgerGroupState({
        collection: targetCollection,
        log: log({
          collected: [hashCode([1]), hashCode([2])],
          hidden: [hashCode([3])],
        }),
        openCollections: [],
      }),
    ).toMatchObject({
      counterLabel: "[2/2]",
      isComplete: true,
    });
  });

  test("uses collection labels and open state", () => {
    expect(
      getLedgerGroupState({
        collection: collection({
          description: "Earned from quests",
          id: "quests",
          name: "Quest Rewards",
        }),
        log: log(),
        openCollections: ["quests"],
      }),
    ).toMatchObject({
      descriptionLabel: "Earned from quests",
      headingLabel: "Quest Rewards",
      isOpen: true,
    });
  });

  test("falls back to the parent name when child has no description", () => {
    expect(
      getLedgerGroupState({
        collection: collection({
          description: undefined,
        }),
        log: log(),
        openCollections: [],
        parentCollection: collection({
          id: "parent",
          name: "Parent Collection",
        }),
      }),
    ).toMatchObject({
      descriptionLabel: "Parent Collection",
    });
  });
});
