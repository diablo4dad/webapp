import { useEffect, useMemo, useRef, useState } from "react";
import { MasterGroup } from "../common";
import type { Collection } from "../data";
import { useData } from "../data/context";
import { selectCollectionById } from "../data/reducers";
import { useEditor } from "../editor/context";
import { updateCatalogCollectionNodeOrder } from "../store/catalog";
import { LedgerListView } from "./ledger-list";
import { LedgerSection } from "./ledger-section";
import type {
  CollectionDragController,
  CollectionDragState,
  LedgerProps,
} from "./ledger-types";
import {
  areCollectionOrdersEqual,
  getCollectionListIds,
  moveCollectionIdToIndex,
  moveCollectionInDb,
  type CollectionParentId,
} from "./reorder";
import {
  createDragAutoScroller,
  getCollectionIdsForDropList,
  getCollectionInsertIndexFromPointer,
  getDragScrollTarget,
  type DragScrollTarget,
} from "./drag";

const Ledger = ({
  collections,
  collectionDragController,
  parentCollection,
  onClickItem,
  onToggleItem,
  onToggleCollection,
  onCollectionChange,
  openCollections,
  depth = 0,
}: LedgerProps) => {
  const { db, group, searchTerm, setDb } = useData();
  const { isEditMode, openCollectionCreator } = useEditor();
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
  const addCollectionLabel =
    depth === 0 ? "Add Collection" : "Add Subcollection";
  const addCollectionParent = depth === 0 ? undefined : parentCollection;

  useEffect(() => {
    collectionDragStateRef.current = collectionDragState;
  }, [collectionDragState]);

  function isCollectionDropAllowed(
    dragState: CollectionDragState,
    targetParentId: CollectionParentId,
  ): boolean {
    if (targetParentId === null) {
      return true;
    }

    if (targetParentId === dragState.collectionId) {
      return false;
    }

    const draggedCollection = selectCollectionById(
      db.collections,
      dragState.collectionId,
    );
    const targetParent = selectCollectionById(db.collections, targetParentId);

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
      collectionReordering ||
      searchTerm.trim() !== "" ||
      group === MasterGroup.UNIVERSAL
    ) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const sourceParentId = sourceParentCollection?.id ?? null;
    const nextDragState: CollectionDragState = {
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

      const hitElement = document.elementFromPoint(pointerX, pointerY);
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
          : selectCollectionById(db.collections, targetCollectionId);

      if (collectionElement && targetCollection) {
        const rect = collectionElement.getBoundingClientRect();
        const isHeaderCenterBand =
          pointerY > rect.top + rect.height * 0.25 &&
          pointerY < rect.bottom - rect.height * 0.25;

        if (
          isHeaderCenterBand &&
          targetCollection.id !== currentDragState.collectionId &&
          isCollectionDropAllowed(currentDragState, targetCollection.id)
        ) {
          nextDragState.targetParentId = targetCollection.id;
          nextDragState.targetIndex = targetCollection.subcollections.length;
          nextDragState.targetSiblingIds = getCollectionListIds(
            targetCollection.subcollections,
          );
          collectionDragStateRef.current = nextDragState;
          setCollectionDragState(nextDragState);
          return;
        }
      }

      if (
        listElement &&
        listElement.dataset.collectionCategory === currentDragState.category
      ) {
        const targetParentId =
          listElement.dataset.collectionParentId === "root"
            ? null
            : listElement.dataset.collectionParentId ?? null;

        if (isCollectionDropAllowed(currentDragState, targetParentId)) {
          nextDragState.targetParentId = targetParentId;
          nextDragState.targetIndex = getCollectionInsertIndexFromPointer(
            listElement,
            pointerY,
          );
          nextDragState.targetSiblingIds =
            getCollectionIdsForDropList(listElement);
        }
      }

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
  const collectionParentId = parentCollection?.id ?? null;
  const collectionIds = useMemo(
    () => getCollectionListIds(collections),
    [collections],
  );
  const collectionsById = useMemo(
    () =>
      new Map(
        collections.map((collection) => [collection.id, collection] as const),
      ),
    [collections],
  );
  const renderedCollectionIds =
    activeCollectionDragController.collectionDragState === undefined
      ? collectionIds
      : activeCollectionDragController.collectionDragState.targetParentId ===
          collectionParentId
        ? moveCollectionIdToIndex(
            collectionIds,
            activeCollectionDragController.collectionDragState.collectionId,
            activeCollectionDragController.collectionDragState.targetIndex,
          )
        : collectionIds.filter(
            (collectionId) =>
              collectionId !==
              activeCollectionDragController.collectionDragState?.collectionId,
          );

  return (
    <LedgerListView
      activeCollectionDragController={activeCollectionDragController}
      addCollectionLabel={addCollectionLabel}
      addCollectionParent={addCollectionParent}
      canAddCollection={canAddCollection}
      collectionIds={collectionIds}
      collectionParentId={collectionParentId}
      collectionsById={collectionsById}
      draggedCollection={draggedCollection}
      group={group}
      isCollectionDragRoot={isCollectionDragRoot}
      onCollectionChange={onCollectionChange}
      onOpenCollectionCreator={openCollectionCreator}
      renderedCollectionIds={renderedCollectionIds}
      renderCollection={({
        collection,
        collectionDragController,
        collectionIndex,
        collectionSiblingIds,
      }) => (
        <LedgerSection
          key={collection.id}
          collection={collection}
          collectionDragController={collectionDragController}
          collectionIndex={collectionIndex}
          collectionSiblingIds={collectionSiblingIds}
          collections={collections}
          depth={depth}
          parentCollection={parentCollection}
          openCollections={openCollections}
          onCollectionChange={onCollectionChange}
          onClickItem={onClickItem}
          onToggleItem={onToggleItem}
          onToggleCollection={onToggleCollection}
          renderSubcollections={(ledgerProps) => <Ledger {...ledgerProps} />}
        />
      )}
    />
  );
};

export default Ledger;
