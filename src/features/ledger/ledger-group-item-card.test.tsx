import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { MagicType, type CollectionItem, type Item } from "../../services/data";
import {
  LedgerGroupItemCard,
  LedgerGroupItemDragGhost,
  LedgerGroupItemDropPlaceholder,
} from "./ledger-group-item-card";
import type { LedgerGroupItemView } from "./ledger-group-item-view";
import type { LedgerGroupItemDragState } from "./types";

vi.mock("../../services/bucket", () => ({
  getIcon: (fileName: string) => `/assets/${fileName}`,
}));

vi.mock("../../shared/ui/LazyLoadImageFallback", () => ({
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

const item: Item = {
  id: 1,
  icon: "icons/fancy.webp",
  invImages: [],
  itemType: {
    id: 2,
    name: "Armor",
  },
  magicType: MagicType.UNIQUE,
  name: "Fancy Helm",
  similarItemsRefs: [],
  usableByClass: [],
};

const collectionItem: CollectionItem = {
  claim: "Drop",
  claimDescription: "Found in a dungeon.",
  id: 10,
  items: [item],
  premium: true,
};

const itemView: LedgerGroupItemView = {
  icon: item.icon,
  isCollected: true,
  item,
  showCollected: true,
  showExcluded: false,
};

const dragState: LedgerGroupItemDragState = {
  draggedItemId: collectionItem.id,
  height: 40,
  insertIndex: 0,
  offsetX: 5,
  offsetY: 7,
  pointerX: 100,
  pointerY: 120,
  width: 180,
};

describe("ledger group item card", () => {
  test("renders details and forwards actions", () => {
    const onClick = vi.fn();
    const onQueueReorder = vi.fn();
    const onStartReorder = vi.fn();
    const onToggle = vi.fn();

    render(
      <LedgerGroupItemCard
        canReorder={true}
        collectionItem={collectionItem}
        isDragging={false}
        isReordering={false}
        itemView={itemView}
        onClick={onClick}
        onQueueReorder={onQueueReorder}
        onStartReorder={onStartReorder}
        onToggle={onToggle}
      />,
    );

    const card = screen
      .getByText("Fancy Helm")
      .closest("[data-reorder-item='true']");

    expect(card).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Fancy Helm" })).toHaveAttribute(
      "src",
      "/assets/icons/fancy.webp",
    );
    expect(screen.getByText("Armor | Drop")).toBeInTheDocument();
    expect(screen.getByText("Found in a dungeon.")).toBeInTheDocument();

    fireEvent.pointerDown(card!);
    fireEvent.click(card!);
    fireEvent.doubleClick(card!);
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Reorder Fancy Helm" }),
    );

    expect(onQueueReorder).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onStartReorder).toHaveBeenCalledOnce();
  });

  test("renders drag placeholder and ghost", () => {
    const { container } = render(
      <>
        <LedgerGroupItemDropPlaceholder />
        <LedgerGroupItemDragGhost
          collectionItem={collectionItem}
          dragState={dragState}
          itemView={itemView}
        />
      </>,
    );

    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    expect(screen.getByText("Fancy Helm")).toBeInTheDocument();
  });
});
