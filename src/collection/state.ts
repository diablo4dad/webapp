import { MasterGroup } from "../common";
import type { Collection } from "../data";
import type { CollectionDragState } from "./types";
import {
  moveCollectionIdToIndex,
  type CollectionParentId,
} from "./reorder";

type AddCollectionOptions = {
  depth: number;
  group: MasterGroup;
  isEditMode: boolean;
  parentCollection?: Collection;
  searchTerm: string;
};

type AddCollectionState = {
  addCollectionLabel: string;
  addCollectionParent?: Collection;
  canAddCollection: boolean;
};

type RenderedCollectionIdsOptions = {
  collectionDragState?: CollectionDragState;
  collectionIds: string[];
  collectionParentId: CollectionParentId;
};

function getAddCollectionState({
  depth,
  group,
  isEditMode,
  parentCollection,
  searchTerm,
}: AddCollectionOptions): AddCollectionState {
  const canAddRootCollection = depth === 0;
  const canAddSubcollectionToParent =
    depth === 1 &&
    parentCollection !== undefined &&
    parentCollection.collectionItems.length === 0 &&
    parentCollection.subcollections.length > 0;
  const canAddCollection =
    isEditMode &&
    searchTerm.trim() === "" &&
    group !== MasterGroup.UNIVERSAL &&
    (canAddRootCollection || canAddSubcollectionToParent);

  return {
    addCollectionLabel: depth === 0 ? "Add Collection" : "Add Subcollection",
    addCollectionParent: depth === 0 ? undefined : parentCollection,
    canAddCollection,
  };
}

function getRenderedCollectionIds({
  collectionDragState,
  collectionIds,
  collectionParentId,
}: RenderedCollectionIdsOptions): string[] {
  if (collectionDragState === undefined) {
    return collectionIds;
  }

  if (collectionDragState.targetParentId === collectionParentId) {
    return moveCollectionIdToIndex(
      collectionIds,
      collectionDragState.collectionId,
      collectionDragState.targetIndex,
    );
  }

  return collectionIds.filter(
    (collectionId) => collectionId !== collectionDragState.collectionId,
  );
}

export { getAddCollectionState, getRenderedCollectionIds };
export type { AddCollectionState };
