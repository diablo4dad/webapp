import { MasterGroup } from "../shared/domain";
import type { Collection } from "../services/data";
import type { CollectionDragState } from "./types";

type StartOptions = {
  group: MasterGroup;
  isReordering: boolean;
  searchTerm: string;
};

type DragRect = Pick<DOMRect, "height" | "left" | "top" | "width">;

type DragStateOptions = {
  collection: Collection;
  group: MasterGroup;
  pointerX: number;
  pointerY: number;
  rect: DragRect;
  sourceIndex: number;
  sourceParentCollection?: Collection;
  sourceSiblingIds: string[];
};

function canStartCollectionReorder({
  group,
  isReordering,
  searchTerm,
}: StartOptions): boolean {
  return (
    !isReordering &&
    searchTerm.trim() === "" &&
    group !== MasterGroup.UNIVERSAL
  );
}

function createCollectionDragState({
  collection,
  group,
  pointerX,
  pointerY,
  rect,
  sourceIndex,
  sourceParentCollection,
  sourceSiblingIds,
}: DragStateOptions): CollectionDragState {
  const sourceParentId = sourceParentCollection?.id ?? null;

  return {
    category: group,
    collectionId: collection.id,
    height: rect.height,
    offsetX: pointerX - rect.left,
    offsetY: pointerY - rect.top,
    pointerX,
    pointerY,
    sourceParentId,
    sourceSiblingIds,
    targetIndex: sourceIndex,
    targetParentId: sourceParentId,
    targetSiblingIds: sourceSiblingIds,
    width: rect.width,
  };
}

export { canStartCollectionReorder, createCollectionDragState };
