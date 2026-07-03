import { describe, expect, test } from "vitest";
import { MasterGroup } from "../../shared/domain";
import {
  MagicType,
  type Collection,
  type CollectionItem,
  type Item,
} from "../../services/data";
import { getLedgerGroupRules } from "./ledger-group-rules";

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

function rules(
  overrides: Partial<Parameters<typeof getLedgerGroupRules>[0]> = {},
) {
  const targetCollection = overrides.collection ?? collection();

  return getLedgerGroupRules({
    collection: targetCollection,
    depth: 0,
    group: MasterGroup.GENERAL,
    hasCollectionDragController: true,
    isEditMode: true,
    parentCollection: undefined,
    searchTerm: "",
    sourceCollection: targetCollection,
    ...overrides,
  });
}

describe("ledger group rules", () => {
  test("allows edit and add actions for editable catalog collections", () => {
    expect(rules()).toMatchObject({
      canAddCollectionItems: true,
      canAddSubcollections: true,
      canEditCollection: true,
      shouldRenderAddItemCard: true,
      shouldRenderAddSubcollectionCard: true,
    });
  });

  test("blocks catalog editing for universal and synthetic collections", () => {
    expect(
      rules({
        collection: collection({
          category: MasterGroup.UNIVERSAL,
        }),
      }),
    ).toMatchObject({
      canEditCollection: false,
      shouldRenderAddItemCard: false,
      shouldRenderAddSubcollectionCard: false,
    });

    expect(
      rules({
        collection: collection({
          id: "888",
        }),
      }),
    ).toMatchObject({
      canEditCollection: false,
    });
  });

  test("requires a clear search and drag controller to reorder collections", () => {
    expect(rules()).toMatchObject({
      canReorderCollections: true,
    });

    expect(
      rules({
        searchTerm: "helm",
      }),
    ).toMatchObject({
      canReorderCollections: false,
    });

    expect(
      rules({
        hasCollectionDragController: false,
      }),
    ).toMatchObject({
      canReorderCollections: false,
    });
  });

  test("requires matching source items to reorder collection items", () => {
    const targetCollection = collection({
      collectionItems: [collectionItem(1), collectionItem(2)],
    });

    expect(
      rules({
        collection: targetCollection,
        sourceCollection: targetCollection,
      }),
    ).toMatchObject({
      canReorderCollectionItems: true,
    });

    expect(
      rules({
        collection: targetCollection,
        sourceCollection: collection({
          collectionItems: [collectionItem(1)],
        }),
      }),
    ).toMatchObject({
      canReorderCollectionItems: false,
    });
  });
});
