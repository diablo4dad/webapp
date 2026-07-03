import type { MasterGroup } from "../shared/domain";
import type { Collection } from "../data";
import { selectCollectionById } from "../data/reducers";
import {
  getCollectionIdsForDropList,
  getCollectionInsertIndexFromPointer,
} from "./reorder-drag";
import type { CollectionDragState } from "./types";
import { getCollectionListIds, type CollectionParentId } from "./order";
import { isCollectionDropAllowed } from "./reorder-rules";

type Options = {
  collections: Collection[];
  currentDragState: CollectionDragState;
  group: MasterGroup;
  hitElement?: Element | null;
  pointerX: number;
  pointerY: number;
};

function getNextCollectionDragState({
  collections,
  currentDragState,
  group,
  hitElement,
  pointerX,
  pointerY,
}: Options): CollectionDragState {
  const collectionElement = hitElement?.closest<HTMLElement>(
    "[data-collection-reorder-item='true']",
  );
  const listElement = hitElement?.closest<HTMLElement>(
    "[data-collection-drop-list='true']",
  );
  const nextDragState: CollectionDragState = {
    ...currentDragState,
    pointerX,
    pointerY,
  };
  const targetCollectionId = collectionElement?.dataset.collectionId;
  const targetCollection =
    targetCollectionId === undefined
      ? undefined
      : selectCollectionById(collections, targetCollectionId);

  if (
    collectionElement &&
    targetCollection &&
    canDropIntoCollectionHeader({
      collectionElement,
      collections,
      currentDragState,
      group,
      pointerY,
      targetCollection,
    })
  ) {
    return {
      ...nextDragState,
      targetParentId: targetCollection.id,
      targetIndex: targetCollection.subcollections.length,
      targetSiblingIds: getCollectionListIds(targetCollection.subcollections),
    };
  }

  if (
    listElement &&
    listElement.dataset.collectionCategory === currentDragState.category
  ) {
    const targetParentId = getCollectionParentIdFromList(listElement);

    if (
      isCollectionDropAllowed({
        collections,
        dragState: currentDragState,
        group,
        targetParentId,
      })
    ) {
      return {
        ...nextDragState,
        targetParentId,
        targetIndex: getCollectionInsertIndexFromPointer(
          listElement,
          pointerY,
        ),
        targetSiblingIds: getCollectionIdsForDropList(listElement),
      };
    }
  }

  return nextDragState;
}

function canDropIntoCollectionHeader({
  collectionElement,
  collections,
  currentDragState,
  group,
  pointerY,
  targetCollection,
}: {
  collectionElement: HTMLElement;
  collections: Collection[];
  currentDragState: CollectionDragState;
  group: MasterGroup;
  pointerY: number;
  targetCollection: Collection;
}): boolean {
  const rect = collectionElement.getBoundingClientRect();
  const isHeaderCenterBand =
    pointerY > rect.top + rect.height * 0.25 &&
    pointerY < rect.bottom - rect.height * 0.25;

  return (
    isHeaderCenterBand &&
    targetCollection.id !== currentDragState.collectionId &&
    isCollectionDropAllowed({
      collections,
      dragState: currentDragState,
      group,
      targetParentId: targetCollection.id,
    })
  );
}

function getCollectionParentIdFromList(
  listElement: HTMLElement,
): CollectionParentId {
  return listElement.dataset.collectionParentId === "root"
    ? null
    : listElement.dataset.collectionParentId ?? null;
}

export { getNextCollectionDragState };
