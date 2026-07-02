import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { MagicType, type CollectionItem, type Item } from "../data";
import {
  ItemCard,
  ItemDragGhost,
  ItemDropPlaceholder,
  type ItemView,
} from "./item-card";
import type { ItemDragState } from "./ledger-types";

vi.mock("../bucket", () => ({
  getIcon: (fileName: string) => `/assets/${fileName}`,
}));

vi.mock("../components/LazyLoadImageFallback", () => ({
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

const itemView: ItemView = {
  icon: item.icon,
  isCollected: true,
  item,
  showCollected: true,
  showExcluded: false,
};

const dragState: ItemDragState = {
  draggedItemId: collectionItem.id,
  height: 40,
  insertIndex: 0,
  offsetX: 5,
  offsetY: 7,
  pointerX: 100,
  pointerY: 120,
  width: 180,
};

describe("item card", () => {
  test("renders details and forwards actions", () => {
    const onClick = vi.fn();
    const onQueueReorder = vi.fn();
    const onStartReorder = vi.fn();
    const onToggle = vi.fn();

    render(
      <ItemCard
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
        <ItemDropPlaceholder />
        <ItemDragGhost
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
