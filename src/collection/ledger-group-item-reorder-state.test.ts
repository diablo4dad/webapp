import { describe, expect, test } from "vitest";
import {
  MagicType,
  type CollectionItem,
  type Item,
} from "../data";
import type { LedgerGroupItemDragState } from "./types";
import {
  createLedgerGroupItemDragState,
  getNextLedgerGroupItemDragState,
  getRenderedLedgerGroupItemIds,
} from "./ledger-group-item-reorder-state";

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

function dragState(
  overrides: Partial<LedgerGroupItemDragState> = {},
): LedgerGroupItemDragState {
  return {
    draggedItemId: 1,
    height: 40,
    insertIndex: 0,
    offsetX: 0,
    offsetY: 0,
    pointerX: 0,
    pointerY: 0,
    width: 100,
    ...overrides,
  };
}

function reorderElement(top = 0, height = 20) {
  const element = document.createElement("div");
  element.dataset.reorderItem = "true";
  element.getBoundingClientRect = () =>
    ({
      bottom: top + height,
      height,
      left: 0,
      right: 100,
      top,
      width: 100,
      x: 0,
      y: top,
      toJSON: () => undefined,
    }) as DOMRect;

  return element;
}

describe("ledger group item reorder state", () => {
  test("creates drag state from pointer and item bounds", () => {
    expect(
      createLedgerGroupItemDragState({
        collectionItem: collectionItem(2),
        collectionItemIds: [1, 2, 3],
        pointerX: 35,
        pointerY: 50,
        rect: {
          height: 40,
          left: 10,
          top: 20,
          width: 100,
        },
      }),
    ).toMatchObject({
      draggedItemId: 2,
      height: 40,
      insertIndex: 1,
      offsetX: 25,
      offsetY: 30,
      pointerX: 35,
      pointerY: 50,
      width: 100,
    });
  });

  test("does not create drag state for unknown items", () => {
    expect(
      createLedgerGroupItemDragState({
        collectionItem: collectionItem(4),
        collectionItemIds: [1, 2, 3],
        pointerX: 35,
        pointerY: 50,
        rect: {
          height: 40,
          left: 10,
          top: 20,
          width: 100,
        },
      }),
    ).toBeUndefined();
  });

  test("renders dragged item at its insert index", () => {
    expect(
      getRenderedLedgerGroupItemIds({
        canReorder: true,
        collectionItemIds: [1, 2, 3],
        dragState: dragState({
          draggedItemId: 1,
          insertIndex: 2,
        }),
      }),
    ).toEqual([2, 3, 1]);
  });

  test("keeps item order when reorder is disabled", () => {
    expect(
      getRenderedLedgerGroupItemIds({
        canReorder: false,
        collectionItemIds: [1, 2, 3],
        dragState: dragState({
          draggedItemId: 1,
          insertIndex: 2,
        }),
      }),
    ).toEqual([1, 2, 3]);
  });

  test("updates pointer and insert index from a list", () => {
    const listElement = document.createElement("div");
    listElement.append(reorderElement(0), reorderElement(20));

    expect(
      getNextLedgerGroupItemDragState({
        currentDragState: dragState(),
        itemListElement: listElement,
        pointerX: 20,
        pointerY: 15,
      }),
    ).toMatchObject({
      insertIndex: 1,
      pointerX: 20,
      pointerY: 15,
    });
  });

  test("keeps insert index without a list", () => {
    expect(
      getNextLedgerGroupItemDragState({
        currentDragState: dragState({
          insertIndex: 2,
        }),
        itemListElement: null,
        pointerX: 20,
        pointerY: 15,
      }),
    ).toMatchObject({
      insertIndex: 2,
      pointerX: 20,
      pointerY: 15,
    });
  });
});
