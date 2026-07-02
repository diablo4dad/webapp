import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Collection, CollectionItem, DadDb } from "../data";
import { updateCatalogCollectionItemOrder } from "../store/catalog";
import {
  createDragAutoScroller,
  getDragScrollTarget,
  type DragScrollTarget,
} from "./reorder-drag";
import {
  createItemDragState,
  getNextItemDragState,
  getRenderedCollectionItemIds,
} from "./item-reorder-state";
import {
  canQueueItemReorder,
  queueItemDragStart,
} from "./item-reorder-queue";
import type { ItemDragState } from "./types";
import {
  areItemOrdersEqual,
  moveItemIdToIndex,
  reorderCollectionItemsInDb,
} from "./order";

type Options = {
  canReorder: boolean;
  collection: Collection;
  collectionItemIds: number[];
  db: DadDb;
  setDb: (db: DadDb) => void;
  sourceCollection?: Collection;
};

function useItemReorder({
  canReorder,
  collection,
  collectionItemIds,
  db,
  setDb,
  sourceCollection,
}: Options) {
  const itemListRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<ItemDragState | undefined>(undefined);
  const itemDragScrollTargetRef = useRef<DragScrollTarget | undefined>(
    undefined,
  );
  const suppressItemClickRef = useRef(false);
  const [dragState, setDragState] = useState<ItemDragState>();
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string>();
  const renderedCollectionItemIds = getRenderedCollectionItemIds({
    canReorder,
    collectionItemIds,
    dragState,
  });

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  function beginItemReorder(
    collectionItem: CollectionItem,
    itemElement: HTMLElement,
    pointerX: number,
    pointerY: number,
  ) {
    const nextDragState = createItemDragState({
      collectionItem,
      collectionItemIds,
      pointerX,
      pointerY,
      rect: itemElement.getBoundingClientRect(),
    });

    if (!nextDragState) {
      return;
    }

    setReorderError(undefined);
    suppressItemClickRef.current = true;
    itemDragScrollTargetRef.current = getDragScrollTarget(itemElement);
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  }

  function startItemReorder(
    event: ReactPointerEvent<HTMLElement>,
    collectionItem: CollectionItem,
  ) {
    if (!canReorder || isReordering || event.button !== 0) {
      return;
    }

    const itemElement = event.currentTarget.closest<HTMLElement>(
      "[data-reorder-item='true']",
    );

    if (itemElement === null) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    beginItemReorder(collectionItem, itemElement, event.clientX, event.clientY);
  }

  function queueItemReorder(
    event: ReactPointerEvent<HTMLDivElement>,
    collectionItem: CollectionItem,
  ) {
    if (
      !canQueueItemReorder({
        button: event.button,
        canReorder,
        isReordering,
        pointerType: event.pointerType,
        target: event.target,
      })
    ) {
      return;
    }

    const itemElement = event.currentTarget;
    queueItemDragStart({
      onStart: (pointerX, pointerY) =>
        beginItemReorder(collectionItem, itemElement, pointerX, pointerY),
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    });
  }

  async function commitItemReorder(committedDragState: ItemDragState) {
    if (!canReorder || !sourceCollection || isReordering) {
      dragStateRef.current = undefined;
      itemDragScrollTargetRef.current = undefined;
      setDragState(undefined);
      return;
    }

    const sourceItemIds = sourceCollection.collectionItems.map(
      (collectionItem) => collectionItem.id,
    );
    const nextItemIds = moveItemIdToIndex(
      sourceItemIds,
      committedDragState.draggedItemId,
      committedDragState.insertIndex,
    );
    dragStateRef.current = undefined;
    itemDragScrollTargetRef.current = undefined;
    setDragState(undefined);

    if (areItemOrdersEqual(sourceItemIds, nextItemIds)) {
      return;
    }

    const previousDb = db;
    setDb(reorderCollectionItemsInDb(previousDb, collection.id, nextItemIds));
    setIsReordering(true);
    setReorderError(undefined);

    try {
      await updateCatalogCollectionItemOrder(collection.id, nextItemIds);
    } catch (error) {
      setDb(previousDb);
      setReorderError(
        error instanceof Error
          ? error.message
          : "Failed to reorder collection items.",
      );
      setIsReordering(false);
      return;
    }

    setIsReordering(false);
  }

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    function updateItemDragPosition(pointerX: number, pointerY: number) {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) {
        return;
      }

      const nextDragState = getNextItemDragState({
        currentDragState,
        itemListElement: itemListRef.current,
        pointerX,
        pointerY,
      });

      dragStateRef.current = nextDragState;
      setDragState(nextDragState);
    }

    const autoScroller = createDragAutoScroller(
      itemDragScrollTargetRef.current,
      () => {
        const currentDragState = dragStateRef.current;

        if (currentDragState) {
          updateItemDragPosition(
            currentDragState.pointerX,
            currentDragState.pointerY,
          );
        }
      },
    );

    function onPointerMove(event: PointerEvent) {
      event.preventDefault();
      autoScroller.update(event.clientY);
      updateItemDragPosition(event.clientX, event.clientY);
    }

    function onPointerUp(event: PointerEvent) {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) {
        autoScroller.stop();
        return;
      }

      event.preventDefault();
      autoScroller.stop();
      void commitItemReorder(currentDragState);
    }

    function onPointerCancel() {
      autoScroller.stop();
      dragStateRef.current = undefined;
      itemDragScrollTargetRef.current = undefined;
      setDragState(undefined);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      autoScroller.stop();
      itemDragScrollTargetRef.current = undefined;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [dragState?.draggedItemId]);

  function shouldSuppressItemClick(): boolean {
    if (!suppressItemClickRef.current) {
      return false;
    }

    suppressItemClickRef.current = false;
    return true;
  }

  return {
    dragState,
    isReordering,
    itemListRef,
    queueItemReorder,
    renderedCollectionItemIds,
    reorderError,
    shouldSuppressItemClick,
    startItemReorder,
  };
}

export { useItemReorder };
