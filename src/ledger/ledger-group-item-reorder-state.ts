import type { CollectionItem } from "../data";
import { moveItemIdToIndex } from "./order";
import { getItemInsertIndexFromPointer } from "./reorder-drag";
import type { LedgerGroupItemDragState } from "./types";

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
  dragState?: LedgerGroupItemDragState;
};

type NextDragStateOptions = {
  currentDragState: LedgerGroupItemDragState;
  itemListElement: HTMLElement | null;
  pointerX: number;
  pointerY: number;
};

function createLedgerGroupItemDragState({
  collectionItem,
  collectionItemIds,
  pointerX,
  pointerY,
  rect,
}: DragStateOptions): LedgerGroupItemDragState | undefined {
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

function getRenderedLedgerGroupItemIds({
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

function getNextLedgerGroupItemDragState({
  currentDragState,
  itemListElement,
  pointerX,
  pointerY,
}: NextDragStateOptions): LedgerGroupItemDragState {
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
  createLedgerGroupItemDragState,
  getNextLedgerGroupItemDragState,
  getRenderedLedgerGroupItemIds,
};
