import { describe, expect, test } from "vitest";
import { MasterGroup } from "../shared/domain";
import type { Collection } from "../data";
import {
  canStartCollectionReorder,
  createCollectionDragState,
} from "./reorder-state";

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

describe("reorder state", () => {
  test("allows collection reorder when editing a clear catalog group", () => {
    expect(
      canStartCollectionReorder({
        group: MasterGroup.GENERAL,
        isReordering: false,
        searchTerm: "",
      }),
    ).toBe(true);
  });

  test("blocks collection reorder while saving, searching, or universal", () => {
    expect(
      canStartCollectionReorder({
        group: MasterGroup.GENERAL,
        isReordering: true,
        searchTerm: "",
      }),
    ).toBe(false);
    expect(
      canStartCollectionReorder({
        group: MasterGroup.GENERAL,
        isReordering: false,
        searchTerm: " helm ",
      }),
    ).toBe(false);
    expect(
      canStartCollectionReorder({
        group: MasterGroup.UNIVERSAL,
        isReordering: false,
        searchTerm: "",
      }),
    ).toBe(false);
  });

  test("creates root drag state from pointer and source order", () => {
    expect(
      createCollectionDragState({
        collection: collection(),
        group: MasterGroup.GENERAL,
        pointerX: 35,
        pointerY: 50,
        rect: {
          height: 44,
          left: 10,
          top: 20,
          width: 120,
        },
        sourceIndex: 1,
        sourceSiblingIds: ["beta", "alpha"],
      }),
    ).toMatchObject({
      category: MasterGroup.GENERAL,
      collectionId: "alpha",
      height: 44,
      offsetX: 25,
      offsetY: 30,
      sourceParentId: null,
      sourceSiblingIds: ["beta", "alpha"],
      targetIndex: 1,
      targetParentId: null,
      targetSiblingIds: ["beta", "alpha"],
      width: 120,
    });
  });

  test("creates child drag state from parent collection", () => {
    expect(
      createCollectionDragState({
        collection: collection({
          id: "child",
        }),
        group: MasterGroup.GENERAL,
        pointerX: 35,
        pointerY: 50,
        rect: {
          height: 44,
          left: 10,
          top: 20,
          width: 120,
        },
        sourceIndex: 0,
        sourceParentCollection: collection({
          id: "parent",
        }),
        sourceSiblingIds: ["child"],
      }),
    ).toMatchObject({
      collectionId: "child",
      sourceParentId: "parent",
      targetParentId: "parent",
    });
  });
});
