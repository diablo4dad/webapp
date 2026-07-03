import { act, renderHook } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { describe, expect, test, vi } from "vitest";
import {
  MagicType,
  type Collection,
  type CollectionItem,
  type DadDb,
  type Item,
} from "../services/data";
import { useLedgerGroupItemReorder } from "./ledger-group-item-reorder";

vi.mock("../services/store/catalog", () => ({
  updateCatalogCollectionItemOrder: vi.fn(),
}));

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
    id: "alpha",
    name: "Alpha",
    collectionItems: [collectionItem(1), collectionItem(2)],
    subcollections: [],
    ...overrides,
  };
}

function db(collections = [collection()]): DadDb {
  return {
    collections,
    items: [],
    itemTypes: [],
  };
}

function reorderElement() {
  const element = document.createElement("div");

  element.getBoundingClientRect = () =>
    ({
      bottom: 60,
      height: 40,
      left: 10,
      right: 110,
      top: 20,
      width: 100,
      x: 10,
      y: 20,
      toJSON: () => undefined,
    }) as DOMRect;

  return element;
}

function pointerEvent(
  element: HTMLElement | null,
  overrides: Partial<ReactPointerEvent<HTMLElement>> = {},
): ReactPointerEvent<HTMLElement> {
  return {
    button: 0,
    clientX: 30,
    clientY: 45,
    currentTarget: {
      closest: () => element,
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as ReactPointerEvent<HTMLElement>;
}

describe("ledger group item reorder", () => {
  test("starts a drag and suppresses the next item click", () => {
    const targetCollection = collection();
    const { result } = renderHook(() =>
      useLedgerGroupItemReorder({
        canReorder: true,
        collection: targetCollection,
        collectionItemIds: [1, 2],
        db: db([targetCollection]),
        setDb: vi.fn(),
        sourceCollection: targetCollection,
      }),
    );
    const event = pointerEvent(reorderElement());

    act(() => {
      result.current.startItemReorder(event, targetCollection.collectionItems[0]);
    });

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(result.current.dragState).toMatchObject({
      draggedItemId: 1,
      height: 40,
      insertIndex: 0,
      offsetX: 20,
      offsetY: 25,
      width: 100,
    });
    expect(result.current.shouldSuppressItemClick()).toBe(true);
    expect(result.current.shouldSuppressItemClick()).toBe(false);
  });

  test("does not start a drag when reordering is disabled", () => {
    const targetCollection = collection();
    const { result } = renderHook(() =>
      useLedgerGroupItemReorder({
        canReorder: false,
        collection: targetCollection,
        collectionItemIds: [1, 2],
        db: db([targetCollection]),
        setDb: vi.fn(),
        sourceCollection: targetCollection,
      }),
    );
    const event = pointerEvent(reorderElement());

    act(() => {
      result.current.startItemReorder(event, targetCollection.collectionItems[0]);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.dragState).toBeUndefined();
    expect(result.current.renderedCollectionItemIds).toEqual([1, 2]);
  });
});
