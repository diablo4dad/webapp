import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import {
  CharacterClass,
  CharacterGender,
  MagicType,
  type Collection,
  type CollectionItem,
  type Item,
} from "../services/data";
import type { LedgerGroupItemDragState } from "./types";
import { LedgerGroupItems } from "./ledger-group-items";
import type { CollectionLog } from "./type";

vi.mock("../services/bucket", () => ({
  getIcon: (fileName: string) => `/assets/${fileName}`,
}));

vi.mock("../shared/ui/LazyLoadImageFallback", () => ({
  FallbackLazyImage: ({
    alt,
    className,
    src,
  }: {
    alt: string;
    className?: string;
    src?: string;
  }) => <img alt={alt} className={className} src={src} />,
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

function dragState(
  overrides: Partial<LedgerGroupItemDragState> = {},
): LedgerGroupItemDragState {
  return {
    draggedItemId: 1,
    height: 40,
    insertIndex: 0,
    offsetX: 5,
    offsetY: 7,
    pointerX: 100,
    pointerY: 120,
    width: 180,
    ...overrides,
  };
}

function renderItems(
  overrides: Partial<Parameters<typeof LedgerGroupItems>[0]> = {},
) {
  const firstItem = collectionItem(1);
  const secondItem = collectionItem(2);
  const targetCollection = collection({
    collectionItems: [firstItem, secondItem],
  });

  return render(
    <LedgerGroupItems
      canReorder={true}
      collectionItemsById={
        new Map(
          targetCollection.collectionItems.map((collectionItem) => [
            collectionItem.id,
            collectionItem,
          ]),
        )
      }
      isReordering={false}
      log={log()}
      onClickItem={vi.fn()}
      onQueueReorder={vi.fn()}
      onStartReorder={vi.fn()}
      onToggleItem={vi.fn()}
      preferredClass={CharacterClass.BARBARIAN}
      preferredGender={CharacterGender.MALE}
      renderedCollectionItemIds={[1, 2]}
      shouldSuppressItemClick={() => false}
      {...overrides}
    />,
  );
}

describe("ledger group items", () => {
  test("renders item cards and forwards item actions", () => {
    const onClickItem = vi.fn();
    const onQueueReorder = vi.fn();
    const onStartReorder = vi.fn();
    const onToggleItem = vi.fn();

    renderItems({
      onClickItem,
      onQueueReorder,
      onStartReorder,
      onToggleItem,
    });

    const card = screen
      .getByText("Item 1")
      .closest("[data-reorder-item='true']");

    fireEvent.pointerDown(card!);
    fireEvent.click(card!);
    fireEvent.doubleClick(card!);
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Reorder Item 1" }),
    );

    expect(onQueueReorder).toHaveBeenCalled();
    expect(onClickItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
      }),
    );
    expect(onToggleItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
      }),
      true,
    );
    expect(onStartReorder).toHaveBeenCalledOnce();
  });

  test("suppresses item click when requested", () => {
    const onClickItem = vi.fn();

    renderItems({
      onClickItem,
      shouldSuppressItemClick: () => true,
    });

    fireEvent.click(
      screen.getByText("Item 1").closest("[data-reorder-item='true']")!,
    );

    expect(onClickItem).not.toHaveBeenCalled();
  });

  test("renders placeholder and drag ghost for dragged item", () => {
    const firstItem = collectionItem(1);
    const { container } = renderItems({
      dragState: dragState(),
      draggedCollectionItem: firstItem,
      collectionItemsById: new Map([[1, firstItem]]),
      renderedCollectionItemIds: [1],
    });

    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });
});
