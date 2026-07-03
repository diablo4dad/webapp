import { describe, expect, test } from "vitest";
import { MasterGroup } from "../shared/domain";
import {
  MagicType,
  type Collection,
  type CollectionItem,
  type Item,
} from "../services/data";
import type { CollectionDragState } from "./types";
import { isCollectionDropAllowed } from "./reorder-rules";

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
    sourceSiblingIds: ["alpha", "beta"],
    targetIndex: 0,
    targetParentId: null,
    targetSiblingIds: ["alpha", "beta"],
    width: 120,
    ...overrides,
  };
}

function canDrop(overrides: {
  collections?: Collection[];
  dragState?: CollectionDragState;
  group?: MasterGroup;
  targetParentId?: string | null;
} = {}) {
  return isCollectionDropAllowed({
    collections:
      overrides.collections ??
      [
        collection(),
        collection({
          id: "target",
          name: "Target",
        }),
      ],
    dragState: overrides.dragState ?? dragState(),
    group: overrides.group ?? MasterGroup.GENERAL,
    targetParentId: overrides.targetParentId ?? "target",
  });
}

describe("reorder rules", () => {
  test("allows root drops", () => {
    expect(canDrop({ targetParentId: null })).toBe(true);
  });

  test("allows leaf collections to move into empty matching parents", () => {
    expect(canDrop()).toBe(true);
  });

  test("blocks dropping into itself or missing targets", () => {
    expect(canDrop({ targetParentId: "alpha" })).toBe(false);
    expect(canDrop({ targetParentId: "missing" })).toBe(false);
  });

  test("blocks dropping into another category", () => {
    expect(
      canDrop({
        collections: [
          collection(),
          collection({
            category: MasterGroup.SEASONS,
            id: "target",
          }),
        ],
      }),
    ).toBe(false);
  });

  test("blocks dropping into parents with items", () => {
    expect(
      canDrop({
        collections: [
          collection(),
          collection({
            collectionItems: [collectionItem(1)],
            id: "target",
          }),
        ],
      }),
    ).toBe(false);
  });

  test("blocks nested collections from moving under another parent", () => {
    expect(
      canDrop({
        collections: [
          collection({
            subcollections: [
              collection({
                id: "child",
              }),
            ],
          }),
          collection({
            id: "target",
          }),
        ],
      }),
    ).toBe(false);
  });
});
