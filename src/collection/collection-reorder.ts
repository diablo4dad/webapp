import { useEffect, useRef, useState } from "react";
import type { MasterGroup } from "../common";
import type { Collection, DadDb } from "../data";
import { selectCollectionById } from "../data/reducers";
import { updateCatalogCollectionNodeOrder } from "../store/catalog";
import {
  createDragAutoScroller,
  getDragScrollTarget,
  type DragScrollTarget,
} from "./drag";
import type {
  CollectionDragController,
  CollectionDragState,
} from "./types";
import {
  areCollectionOrdersEqual,
  moveCollectionIdToIndex,
  moveCollectionInDb,
} from "./reorder";
import {
  canStartCollectionReorder,
  createCollectionDragState,
} from "./reorder-state";
import { getNextCollectionDragState } from "./reorder-target";

type Options = {
  collectionDragController?: CollectionDragController;
  db: DadDb;
  group: MasterGroup;
  searchTerm: string;
  setDb: (db: DadDb) => void;
};

function useCollectionReorder({
  collectionDragController,
  db,
  group,
  searchTerm,
  setDb,
}: Options) {
  const collectionDragStateRef = useRef<CollectionDragState | undefined>(
    undefined,
  );
  const collectionDragScrollTargetRef = useRef<DragScrollTarget | undefined>(
    undefined,
  );
  const [collectionDragState, setCollectionDragState] =
    useState<CollectionDragState>();
  const [collectionReordering, setCollectionReordering] = useState(false);
  const [collectionDragError, setCollectionDragError] = useState<string>();
  const isCollectionDragRoot = collectionDragController === undefined;
  const draggedCollection =
    collectionDragState && isCollectionDragRoot
      ? selectCollectionById(db.collections, collectionDragState.collectionId)
      : undefined;

  useEffect(() => {
    collectionDragStateRef.current = collectionDragState;
  }, [collectionDragState]);

  function beginCollectionReorder(
    collection: Collection,
    sourceParentCollection: Collection | undefined,
    sourceIndex: number,
    sourceSiblingIds: string[],
    element: HTMLElement,
    pointerX: number,
    pointerY: number,
  ) {
    if (
      !canStartCollectionReorder({
        group,
        isReordering: collectionReordering,
        searchTerm,
      })
    ) {
      return;
    }

    const nextDragState = createCollectionDragState({
      collection,
      group,
      pointerX,
      pointerY,
      rect: element.getBoundingClientRect(),
      sourceIndex,
      sourceParentCollection,
      sourceSiblingIds,
    });

    setCollectionDragError(undefined);
    collectionDragScrollTargetRef.current = getDragScrollTarget(element);
    collectionDragStateRef.current = nextDragState;
    setCollectionDragState(nextDragState);
  }

  async function commitCollectionReorder(
    committedDragState: CollectionDragState,
  ) {
    const orderedSiblingIds = moveCollectionIdToIndex(
      committedDragState.targetSiblingIds,
      committedDragState.collectionId,
      committedDragState.targetIndex,
    );

    collectionDragStateRef.current = undefined;
    collectionDragScrollTargetRef.current = undefined;
    setCollectionDragState(undefined);

    if (
      committedDragState.sourceParentId === committedDragState.targetParentId &&
      areCollectionOrdersEqual(
        committedDragState.sourceSiblingIds,
        orderedSiblingIds,
      )
    ) {
      return;
    }

    const previousDb = db;
    setDb(
      moveCollectionInDb(
        previousDb,
        committedDragState.collectionId,
        committedDragState.targetParentId,
        orderedSiblingIds,
        committedDragState.category,
      ),
    );
    setCollectionReordering(true);
    setCollectionDragError(undefined);

    try {
      await updateCatalogCollectionNodeOrder({
        category: committedDragState.category,
        collectionId: committedDragState.collectionId,
        orderedSiblingIds,
        parentId: committedDragState.targetParentId,
      });
    } catch (error) {
      setDb(previousDb);
      setCollectionDragError(
        error instanceof Error
          ? error.message
          : "Failed to reorder collections.",
      );
      setCollectionReordering(false);
      return;
    }

    setCollectionReordering(false);
  }

  useEffect(() => {
    if (!collectionDragState || !isCollectionDragRoot) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    function updateCollectionDragPosition(pointerX: number, pointerY: number) {
      const currentDragState = collectionDragStateRef.current;
      if (!currentDragState) {
        return;
      }

      const nextDragState = getNextCollectionDragState({
        collections: db.collections,
        currentDragState,
        group,
        hitElement: document.elementFromPoint(pointerX, pointerY),
        pointerX,
        pointerY,
      });

      collectionDragStateRef.current = nextDragState;
      setCollectionDragState(nextDragState);
    }

    const autoScroller = createDragAutoScroller(
      collectionDragScrollTargetRef.current,
      () => {
        const currentDragState = collectionDragStateRef.current;

        if (currentDragState) {
          updateCollectionDragPosition(
            currentDragState.pointerX,
            currentDragState.pointerY,
          );
        }
      },
    );

    function onPointerMove(event: PointerEvent) {
      event.preventDefault();
      autoScroller.update(event.clientY);
      updateCollectionDragPosition(event.clientX, event.clientY);
    }

    function onPointerUp(event: PointerEvent) {
      const currentDragState = collectionDragStateRef.current;
      if (!currentDragState) {
        autoScroller.stop();
        return;
      }

      event.preventDefault();
      autoScroller.stop();
      void commitCollectionReorder(currentDragState);
    }

    function onPointerCancel() {
      autoScroller.stop();
      collectionDragStateRef.current = undefined;
      collectionDragScrollTargetRef.current = undefined;
      setCollectionDragState(undefined);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      autoScroller.stop();
      collectionDragScrollTargetRef.current = undefined;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [collectionDragState?.collectionId, isCollectionDragRoot]);

  const activeCollectionDragController =
    collectionDragController ??
    ({
      beginCollectionReorder,
      collectionDragError,
      collectionDragState,
      collectionReordering,
    } satisfies CollectionDragController);

  return {
    activeCollectionDragController,
    draggedCollection,
    isCollectionDragRoot,
  };
}

export { useCollectionReorder };
