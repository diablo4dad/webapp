import type { CollectionItem } from "../data";
import { getItemInsertIndexFromPointer } from "./drag";
import type { ItemDragState } from "./types";
import { moveItemIdToIndex } from "./reorder";

type DragRect = Pick<DOMRect, "height" | "left" | "top" | "width">;

type DragStateOptions = {
  collectionItem: CollectionItem;
  collectionItemIds: number[];
  pointerX: number;
  pointerY: number;
  rect: DragRect;
};

type RenderedIdsOptions = {
  canReorder: boolean;
  collectionItemIds: number[];
  dragState?: ItemDragState;
};

type NextDragStateOptions = {
  currentDragState: ItemDragState;
  itemListElement: HTMLElement | null;
  pointerX: number;
  pointerY: number;
};

function createItemDragState({
  collectionItem,
  collectionItemIds,
  pointerX,
  pointerY,
  rect,
}: DragStateOptions): ItemDragState | undefined {
  const draggedIndex = collectionItemIds.indexOf(collectionItem.id);

  if (draggedIndex === -1) {
    return undefined;
  }

  return {
    draggedItemId: collectionItem.id,
    height: rect.height,
    insertIndex: draggedIndex,
    offsetX: pointerX - rect.left,
    offsetY: pointerY - rect.top,
    pointerX,
    pointerY,
    width: rect.width,
  };
}

function getRenderedCollectionItemIds({
  canReorder,
  collectionItemIds,
  dragState,
}: RenderedIdsOptions): number[] {
  return dragState && canReorder
    ? moveItemIdToIndex(
        collectionItemIds,
        dragState.draggedItemId,
        dragState.insertIndex,
      )
    : collectionItemIds;
}

function getNextItemDragState({
  currentDragState,
  itemListElement,
  pointerX,
  pointerY,
}: NextDragStateOptions): ItemDragState {
  const insertIndex = itemListElement
    ? getItemInsertIndexFromPointer(itemListElement, pointerX, pointerY)
    : currentDragState.insertIndex;

  return {
    ...currentDragState,
    insertIndex,
    pointerX,
    pointerY,
  };
}

export {
  createItemDragState,
  getNextItemDragState,
  getRenderedCollectionItemIds,
};
