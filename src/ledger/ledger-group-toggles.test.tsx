import { act, renderHook } from "@testing-library/react";
import type { Dispatch } from "react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import {
  MagicType,
  type Collection,
  type CollectionItem,
  type Item,
} from "../data";
import {
  type CollectionAction,
  CollectionActionType,
  CollectionDispatchContext,
} from "./context";
import { useLedgerGroupToggles } from "./ledger-group-toggles";

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
    collectionItems: [collectionItem(1)],
    subcollections: [],
    ...overrides,
  };
}

function wrapper(dispatch: Dispatch<CollectionAction>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <CollectionDispatchContext.Provider value={dispatch}>
        {children}
      </CollectionDispatchContext.Provider>
    );
  };
}

describe("ledger group toggles", () => {
  test("dispatches item toggles", () => {
    const dispatch = vi.fn();
    const onToggleItem = vi.fn();
    const targetItem = collectionItem(1);
    const { result } = renderHook(
      () => useLedgerGroupToggles({ onToggleItem }),
      { wrapper: wrapper(dispatch as Dispatch<CollectionAction>) },
    );

    act(() => {
      result.current.toggleItem(targetItem)(true);
    });

    expect(onToggleItem).toHaveBeenCalledWith(targetItem);
    expect(dispatch).toHaveBeenCalledWith({
      type: CollectionActionType.COLLECT,
      itemId: [1],
      toggle: true,
    });
  });

  test("dispatches collection toggles for nested items", () => {
    const dispatch = vi.fn();
    const onToggleCollection = vi.fn();
    const targetCollection = collection({
      collectionItems: [collectionItem(1)],
      subcollections: [
        collection({
          id: "child",
          collectionItems: [collectionItem(2)],
        }),
      ],
    });
    const { result } = renderHook(
      () => useLedgerGroupToggles({ onToggleCollection }),
      { wrapper: wrapper(dispatch as Dispatch<CollectionAction>) },
    );

    act(() => {
      result.current.toggleCollection(targetCollection)(false);
    });

    expect(onToggleCollection).toHaveBeenCalledWith(targetCollection);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: CollectionActionType.COLLECT,
      itemId: [1],
      toggle: false,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: CollectionActionType.COLLECT,
      itemId: [2],
      toggle: false,
    });
  });
});
