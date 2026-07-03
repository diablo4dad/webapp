import type { MasterGroup } from "../shared/domain";
import type { Collection } from "../services/data";
import { selectCollectionById } from "../services/data/reducers";
import type { CollectionDragState } from "./types";
import type { CollectionParentId } from "./order";

type Options = {
  collections: Collection[];
  dragState: CollectionDragState;
  group: MasterGroup;
  targetParentId: CollectionParentId;
};

function isCollectionDropAllowed({
  collections,
  dragState,
  group,
  targetParentId,
}: Options): boolean {
  if (targetParentId === null) {
    return true;
  }

  if (targetParentId === dragState.collectionId) {
    return false;
  }

  const draggedCollection = selectCollectionById(
    collections,
    dragState.collectionId,
  );
  const targetParent = selectCollectionById(collections, targetParentId);

  if (!draggedCollection || !targetParent) {
    return false;
  }

  if (targetParent.category !== group) {
    return false;
  }

  if (targetParent.collectionItems.length > 0) {
    return false;
  }

  return draggedCollection.subcollections.length === 0;
}

export { isCollectionDropAllowed };
