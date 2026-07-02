import { describe, expect, test } from "vitest";
import { MasterGroup } from "../common";
import type { Collection } from "../data";
import type { CollectionDragState } from "./ledger-types";
import {
  getAddCollectionState,
  getRenderedCollectionIds,
} from "./ledger-state";

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

function dragState(
  overrides: Partial<CollectionDragState> = {},
): CollectionDragState {
  return {
    category: MasterGroup.GENERAL,
    collectionId: "alpha",
    height: 40,
    offsetX: 0,
    offsetY: 0,
    pointerX: 0,
    pointerY: 0,
    sourceParentId: null,
    sourceSiblingIds: ["alpha", "beta", "gamma"],
    targetIndex: 2,
    targetParentId: null,
    targetSiblingIds: ["alpha", "beta", "gamma"],
    width: 120,
    ...overrides,
  };
}

describe("ledger state", () => {
  test("allows adding root collections while editing", () => {
    expect(
      getAddCollectionState({
        depth: 0,
        group: MasterGroup.GENERAL,
        isEditMode: true,
        searchTerm: "",
      }),
    ).toMatchObject({
      addCollectionLabel: "Add Collection",
      addCollectionParent: undefined,
      canAddCollection: true,
    });
  });

  test("allows adding subcollections to empty collection groups", () => {
    const parentCollection = collection({
      subcollections: [collection({ id: "child" })],
    });

    expect(
      getAddCollectionState({
        depth: 1,
        group: MasterGroup.GENERAL,
        isEditMode: true,
        parentCollection,
        searchTerm: "",
      }),
    ).toMatchObject({
      addCollectionLabel: "Add Subcollection",
      addCollectionParent: parentCollection,
      canAddCollection: true,
    });
  });

  test("blocks adding while searching or in universal group", () => {
    expect(
      getAddCollectionState({
        depth: 0,
        group: MasterGroup.GENERAL,
        isEditMode: true,
        searchTerm: "helm",
      }),
    ).toMatchObject({
      canAddCollection: false,
    });

    expect(
      getAddCollectionState({
        depth: 0,
        group: MasterGroup.UNIVERSAL,
        isEditMode: true,
        searchTerm: "",
      }),
    ).toMatchObject({
      canAddCollection: false,
    });
  });

  test("renders dragged collection in target parent order", () => {
    expect(
      getRenderedCollectionIds({
        collectionDragState: dragState(),
        collectionIds: ["alpha", "beta", "gamma"],
        collectionParentId: null,
      }),
    ).toEqual(["beta", "gamma", "alpha"]);
  });

  test("removes dragged collection outside the target parent", () => {
    expect(
      getRenderedCollectionIds({
        collectionDragState: dragState({
          targetParentId: "target",
        }),
        collectionIds: ["alpha", "beta", "gamma"],
        collectionParentId: null,
      }),
    ).toEqual(["beta", "gamma"]);
  });
});
