import { FallbackLazyImage } from "../components/LazyLoadImageFallback";
import {
  Collection,
  CollectionItem,
  getDefaultItem,
  MagicType,
} from "../data";
import { getItemDescription } from "../i18n";
import styles from "./Ledger.module.css";
import React, {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Close,
  Currency,
  GripVertical,
  Pencil,
  Tick,
  TickCircle,
} from "../components/Icons";
import {
  getAllCollectionItems,
  getClassIconVariant,
  getClassItemVariant,
  getItemIds,
  getItemName,
  getItemType,
} from "../data/getters";
import { countAllItemsInCollection } from "../data/aggregate";
import {
  countItemsInCollectionHidden,
  countItemsInCollectionOwned,
} from "./aggregate";
import { onTouchStart } from "../common/dom";
import placeholder from "../image/placeholder.webp";
import { AccordionItem } from "@szhsin/react-accordion";
import { useSettings } from "../settings/context";
import { LedgerView } from "../settings/type";
import classNames from "classnames";
import { isLedgerInverse, isLedgerView } from "../settings/predicate";
import { isCollectionEmpty } from "../data/predicates";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./context";
import { isItemCollected, isItemHidden } from "./predicate";
import btnStyles from "../components/Button.module.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/Tooltip";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { getIcon } from "../bucket";
import { useEditor } from "../editor/context";
import { Plus } from "../components/Icons";
import { MasterGroup } from "../common";
import { useData } from "../data/context";
import { selectCollectionById } from "../data/reducers";
import {
  updateCatalogCollectionNodeOrder,
  updateCatalogCollectionItemOrder,
} from "../store/catalog";
import { LedgerListView } from "./ledger-list";
import type {
  CollectionDragController,
  CollectionDragState,
  ItemDragState,
  LedgerInnerProps,
  LedgerProps,
} from "./ledger-types";
import {
  areCollectionOrdersEqual,
  areItemOrdersEqual,
  getCollectionListIds,
  moveCollectionIdToIndex,
  moveCollectionInDb,
  moveItemIdToIndex,
  reorderCollectionItemsInDb,
  type CollectionParentId,
} from "./reorder";
import {
  createDragAutoScroller,
  getCollectionIdsForDropList,
  getCollectionInsertIndexFromPointer,
  getDragScrollTarget,
  getItemInsertIndexFromPointer,
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
        <LedgerInner
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
        />
      )}
    />
  );
};

const LedgerInner = ({
  collection,
  collectionDragController,
  collectionIndex,
  collectionSiblingIds,
  depth = 0,
  parentCollection,
  onClickItem,
  onToggleItem,
  onToggleCollection,
  onCollectionChange,
  openCollections,
}: LedgerInnerProps) => {
  const settings = useSettings();
  const log = useCollection();
  const dispatch = useCollectionDispatch();
  const { db, group, searchTerm, setDb } = useData();
  const {
    isEditMode,
    openCollectionCreator,
    openCollectionEditor,
    openCollectionItemEditor,
  } = useEditor();
  const toggleCountDown = useRef<NodeJS.Timeout | undefined>(undefined);
  const itemListRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<ItemDragState | undefined>(undefined);
  const itemDragScrollTargetRef = useRef<DragScrollTarget | undefined>(
    undefined,
  );
  const suppressItemClickRef = useRef(false);
  const [dragState, setDragState] = useState<ItemDragState>();
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string>();

  // preferences
  const preferredClass = getPreferredClass(settings);
  const preferredGender = getPreferredGender(settings);
  const sourceCollection = useMemo(
    () => selectCollectionById(db.collections, collection.id),
    [db.collections, collection.id],
  );

  const toggleItem = (dci: CollectionItem) => (collected: boolean) => {
    if (onToggleItem) {
      onToggleItem(dci);
    }

    dispatch({
      type: CollectionActionType.COLLECT,
      itemId: getItemIds(dci),
      toggle: collected,
    });
  };

  const toggleCollection = (dc: Collection) => (collected: boolean) => {
    if (onToggleCollection) {
      onToggleCollection(dc);
    }

    getAllCollectionItems(dc).forEach((dci) => {
      dispatch({
        type: CollectionActionType.COLLECT,
        itemId: getItemIds(dci),
        toggle: collected,
      });
    });
  };

  const collected = countItemsInCollectionOwned(log, collection);
  const total =
    countAllItemsInCollection(collection) -
    countItemsInCollectionHidden(log, collection);
  const isComplete = collected === total;
  const ledgerIsOpen = openCollections.includes(collection.id);

  const headingLabel = collection.name;
  const counterLabel = `[${collected}/${total}]`;
  const descriptionLabel =
    parentCollection && !collection.description
      ? parentCollection.name
      : collection.description;

  const className = classNames({
    [styles.Ledger]: true,
    [styles.LedgerComplete]: isComplete,
    [styles.LedgerCards]: isLedgerView(settings, LedgerView.CARD),
    [styles.LedgerCardsInverse]: isLedgerInverse(settings),
  });
  const isEditableCatalogCollection =
    isEditMode &&
    collection.id !== "888" &&
    collection.category !== MasterGroup.UNIVERSAL &&
    parentCollection?.category !== MasterGroup.UNIVERSAL;
  const hasCollectionItems = collection.collectionItems.length > 0;
  const hasSubcollections = collection.subcollections.length > 0;
  const canAddCollectionItems =
    isEditableCatalogCollection && !hasSubcollections;
  const canAddSubcollections =
    isEditableCatalogCollection && depth === 0 && !hasCollectionItems;
  const shouldRenderAddItemCard = canAddCollectionItems;
  const shouldRenderAddSubcollectionCard =
    canAddSubcollections &&
    !hasSubcollections &&
    group !== MasterGroup.UNIVERSAL;
  const canEditCollection = isEditableCatalogCollection;
  const canReorderCollections =
    canEditCollection &&
    searchTerm.trim() === "" &&
    collectionDragController !== undefined &&
    group !== MasterGroup.UNIVERSAL;
  const canReorderCollectionItems =
    isEditableCatalogCollection &&
    searchTerm.trim() === "" &&
    sourceCollection !== undefined &&
    collection.collectionItems.length > 1 &&
    collection.collectionItems.length ===
      sourceCollection.collectionItems.length;
  const collectionItemsById = useMemo(
    () =>
      new Map(
        collection.collectionItems.map((collectionItem) => [
          collectionItem.id,
          collectionItem,
        ]),
      ),
    [collection.collectionItems],
  );
  const collectionItemIds = useMemo(
    () => collection.collectionItems.map((collectionItem) => collectionItem.id),
    [collection.collectionItems],
  );
  const renderedCollectionItemIds =
    dragState && canReorderCollectionItems
      ? moveItemIdToIndex(
          collectionItemIds,
          dragState.draggedItemId,
          dragState.insertIndex,
        )
      : collectionItemIds;
  const draggedCollectionItem =
    dragState && canReorderCollectionItems
      ? collectionItemsById.get(dragState.draggedItemId)
      : undefined;

  function startCollectionReorder(event: ReactPointerEvent<HTMLElement>) {
    if (
      !canReorderCollections ||
      !collectionDragController ||
      collectionDragController.collectionReordering ||
      event.button !== 0
    ) {
      return;
    }

    const element = event.currentTarget.closest<HTMLElement>(
      "[data-collection-reorder-item='true']",
    );

    if (!element) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    collectionDragController.beginCollectionReorder(
      collection,
      parentCollection,
      collectionIndex,
      collectionSiblingIds,
      element,
      event.clientX,
      event.clientY,
    );
  }

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  function beginItemReorder(
    collectionItem: CollectionItem,
    itemElement: HTMLElement,
    pointerX: number,
    pointerY: number,
  ) {
    const draggedIndex = collectionItemIds.indexOf(collectionItem.id);

    if (draggedIndex === -1) {
      return;
    }

    const rect = itemElement.getBoundingClientRect();
    const nextDragState = {
      draggedItemId: collectionItem.id,
      height: rect.height,
      insertIndex: draggedIndex,
      offsetX: pointerX - rect.left,
      offsetY: pointerY - rect.top,
      pointerX,
      pointerY,
      width: rect.width,
    };

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
    if (!canReorderCollectionItems || isReordering || event.button !== 0) {
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
      !canReorderCollectionItems ||
      isReordering ||
      event.button !== 0 ||
      event.pointerType === "touch" ||
      (event.target as HTMLElement).closest("button")
    ) {
      return;
    }

    const itemElement = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;

    function cleanup() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }

    function onPointerMove(pointerEvent: PointerEvent) {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      const distance = Math.hypot(
        pointerEvent.clientX - startX,
        pointerEvent.clientY - startY,
      );

      if (distance < 6) {
        return;
      }

      pointerEvent.preventDefault();
      cleanup();
      beginItemReorder(
        collectionItem,
        itemElement,
        pointerEvent.clientX,
        pointerEvent.clientY,
      );
    }

    function onPointerUp(pointerEvent: PointerEvent) {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      cleanup();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  async function commitItemReorder(committedDragState: ItemDragState) {
    if (!canReorderCollectionItems || !sourceCollection || isReordering) {
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

      const insertIndex = itemListRef.current
        ? getItemInsertIndexFromPointer(itemListRef.current, pointerX, pointerY)
        : currentDragState.insertIndex;

      const nextDragState = {
        ...currentDragState,
        insertIndex,
        pointerX,
        pointerY,
      };

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

  function getCollectionItemView(collectionItem: CollectionItem) {
    const item =
      getClassItemVariant(collectionItem, preferredClass) ??
      getDefaultItem(collectionItem);
    const icon =
      getClassIconVariant(item, preferredClass, preferredGender) ?? item.icon;
    const itemIds = getItemIds(collectionItem);
    const isCollected = isItemCollected(log, itemIds);
    const isHidden = isItemHidden(log, itemIds);
    const showCollected =
      isCollected && !isHidden && !collectionItem.unobtainable;
    const showExcluded = isHidden || collectionItem.unobtainable;

    return {
      icon,
      isCollected,
      item,
      showCollected,
      showExcluded,
    };
  }

  function getCollectionItemClassName(
    collectionItem: CollectionItem,
    item: ReturnType<typeof getCollectionItemView>["item"],
    options: { isGhost?: boolean } = {},
  ) {
    return classNames({
      [styles.Item]: true,
      [styles.ItemDragReady]:
        canReorderCollectionItems && !options.isGhost && !dragState,
      [styles.ItemDragGhost]: options.isGhost,
      [styles.ItemReorderSaving]: isReordering && !options.isGhost,
      [styles.ItemCollected]:
        getCollectionItemView(collectionItem).showCollected,
      [styles.ItemHidden]: getCollectionItemView(collectionItem).showExcluded,
      [styles.ItemPremium]: collectionItem.premium,
      [styles.ItemUnique]: item.magicType === MagicType.UNIQUE,
      [styles.ItemMythic]: item.magicType === MagicType.MYTHIC,
    });
  }

  function renderCollectionItemContent(
    collectionItem: CollectionItem,
    item: ReturnType<typeof getCollectionItemView>["item"],
    icon: string,
    showDragHandle: boolean,
  ) {
    return (
      <>
        {showDragHandle && canReorderCollectionItems && (
          <button
            type="button"
            className={styles.ItemDragHandle}
            aria-label={`Reorder ${getItemName(collectionItem, item)}`}
            title="Reorder item"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => startItemReorder(event, collectionItem)}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <GripVertical />
          </button>
        )}
        <FallbackLazyImage
          wrapperClassName={styles.ItemImageWrapper}
          placeholderSrc={placeholder}
          className={styles.ItemImage}
          src={getIcon(icon)}
          alt={getItemName(collectionItem, item)}
        />
        <div className={styles.ItemInfo}>
          <div className={styles.ItemName}>
            {getItemName(collectionItem, item)}
          </div>
          <div className={styles.ItemType}>
            <span>
              {getItemType(collectionItem, item)} | {collectionItem.claim}
            </span>
            <span
              className={styles.ItemIconPremiumTitle}
              hidden={!collectionItem.premium}
            >
              <Currency />
            </span>
          </div>
          <div className={styles.ItemClaimDescription}>
            {getItemDescription(collectionItem)}
          </div>
        </div>
        <div className={styles.ItemIcons}>
          <span className={styles.ItemIcon + " " + styles.ItemIconPremium}>
            <Currency></Currency>
          </span>
          {getCollectionItemView(collectionItem).isCollected && (
            <span className={styles.ItemIcon + " " + styles.ItemIconCollection}>
              <TickCircle></TickCircle>
            </span>
          )}
          {getCollectionItemView(collectionItem).showExcluded && (
            <span className={styles.ItemIcon + " " + styles.ItemIconHidden}>
              <Close></Close>
            </span>
          )}
        </div>
      </>
    );
  }

  return (
    <AccordionItem
      hidden={!isEditMode && isCollectionEmpty(collection)}
      initialEntered={ledgerIsOpen || collection.id === "888"}
      itemKey={collection.id}
      className={className}
      headingProps={{
        className: styles.LedgerHeader,
      }}
      buttonProps={{
        className: classNames(styles.LedgerButton, {
          [styles.CollectionReorderSaving]:
            collectionDragController?.collectionReordering,
        }),
      }}
      contentProps={{
        className: styles.LedgerContent,
      }}
      header={
        <span
          className={styles.LedgerHeaderContent}
          data-collection-id={collection.id}
          data-collection-reorder-item="true"
        >
          {canReorderCollections && (
            <span
              className={styles.CollectionDragHandle}
              aria-label={`Reorder ${collection.name}`}
              role="button"
              tabIndex={0}
              title="Reorder collection"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerDown={startCollectionReorder}
            >
              <GripVertical />
            </span>
          )}
          <div>
            <h1 className={styles.LedgerTitle}>
              <span className={styles.LedgerCollectionName}>
                {headingLabel}
              </span>
              <span className={styles.LedgerCounter}>{counterLabel}</span>
            </h1>
            <div className={styles.LedgerDescription}>{descriptionLabel}</div>
          </div>
          <span className={styles.LedgerActions}>
            {canEditCollection && (
              <Tooltip placement={"left"}>
                <TooltipTrigger asChild={true}>
                  <span
                    className={classNames(btnStyles.Btn, btnStyles.BtnGrey)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCollectionEditor(collection, parentCollection);
                    }}
                    aria-label="Edit collection"
                  >
                    <Pencil />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Edit collection</TooltipContent>
              </Tooltip>
            )}
            <Tooltip placement={"left"}>
              <TooltipTrigger asChild={true}>
                <span
                  className={classNames({
                    [btnStyles.Btn]: true,
                    [btnStyles.BtnGreen]: isComplete,
                    [btnStyles.BtnGrey]: !isComplete,
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={() => {
                    clearTimeout(toggleCountDown.current);
                    toggleCountDown.current = setTimeout(() => {
                      toggleCollection(collection)(!isComplete);
                    }, 500);
                  }}
                  onMouseUp={() => {
                    clearTimeout(toggleCountDown.current);
                  }}
                  onTouchStart={() => {
                    clearTimeout(toggleCountDown.current);
                    toggleCountDown.current = setTimeout(() => {
                      toggleCollection(collection)(!isComplete);
                    }, 500);
                  }}
                  onTouchEnd={() => {
                    clearTimeout(toggleCountDown.current);
                  }}
                >
                  <Tick></Tick>
                </span>
              </TooltipTrigger>
              <TooltipContent>Hold down to toggle</TooltipContent>
            </Tooltip>
          </span>
        </span>
      }
    >
      {({ state }) => {
        // this is a heavy render; skip unless open
        if (["exited", "unmounted"].includes(state.status)) {
          return null;
        }

        return (
          <div
            ref={itemListRef}
            className={
              collection.subcollections.length
                ? styles.LedgerSubCollection
                : styles.LedgerRow
            }
          >
            {renderedCollectionItemIds.map((collectionItemId) => {
              if (dragState?.draggedItemId === collectionItemId) {
                return (
                  <div
                    key={`drop-placeholder-${collectionItemId}`}
                    className={classNames(
                      styles.Item,
                      styles.ItemDropPlaceholder,
                    )}
                    aria-hidden="true"
                  >
                    <div className={styles.ItemDropPlaceholderVisual} />
                    <div className={styles.ItemDropPlaceholderInfo} />
                  </div>
                );
              }

              const collectionItem = collectionItemsById.get(collectionItemId);
              if (!collectionItem) {
                return null;
              }

              const itemView = getCollectionItemView(collectionItem);

              return (
                <div
                  className={getCollectionItemClassName(
                    collectionItem,
                    itemView.item,
                  )}
                  data-reorder-item="true"
                  onPointerDown={(event) =>
                    queueItemReorder(event, collectionItem)
                  }
                  onClick={() => {
                    if (suppressItemClickRef.current) {
                      suppressItemClickRef.current = false;
                      return;
                    }

                    if (!dragState) {
                      onClickItem(collectionItem, collection);
                    }
                  }}
                  onDoubleClick={() =>
                    toggleItem(collectionItem)(!itemView.isCollected)
                  }
                  onTouchStart={onTouchStart(() =>
                    toggleItem(collectionItem)(!itemView.isCollected),
                  )}
                  key={collectionItem.id}
                >
                  {renderCollectionItemContent(
                    collectionItem,
                    itemView.item,
                    itemView.icon,
                    true,
                  )}
                </div>
              );
            })}
            {dragState && draggedCollectionItem && (
              <div
                className={getCollectionItemClassName(
                  draggedCollectionItem,
                  getCollectionItemView(draggedCollectionItem).item,
                  { isGhost: true },
                )}
                style={
                  {
                    "--drag-ghost-height": `${dragState.height}px`,
                    "--drag-ghost-width": `${dragState.width}px`,
                    height: dragState.height,
                    left: dragState.pointerX - dragState.offsetX,
                    top: dragState.pointerY - dragState.offsetY,
                    width: dragState.width,
                  } as CSSProperties
                }
              >
                {renderCollectionItemContent(
                  draggedCollectionItem,
                  getCollectionItemView(draggedCollectionItem).item,
                  getCollectionItemView(draggedCollectionItem).icon,
                  false,
                )}
              </div>
            )}
            {reorderError && (
              <div className={styles.ItemReorderError}>{reorderError}</div>
            )}
            {shouldRenderAddItemCard && (
              <button
                type="button"
                className={classNames(styles.Item, styles.ItemAdd)}
                onClick={() => openCollectionItemEditor(collection)}
              >
                <div className={styles.ItemAddVisual}>
                  <span className={styles.ItemAddIcon}>
                    <Plus />
                  </span>
                </div>
                <div className={styles.ItemAddInfo}>
                  <div className={styles.ItemAddText}>Add Item</div>
                </div>
              </button>
            )}
            {shouldRenderAddSubcollectionCard && (
              <button
                type="button"
                className={classNames(styles.Item, styles.ItemAdd)}
                onClick={() => openCollectionCreator(collection, group)}
              >
                <div className={styles.ItemAddVisual}>
                  <span className={styles.ItemAddIcon}>
                    <Plus />
                  </span>
                </div>
                <div className={styles.ItemAddInfo}>
                  <div className={styles.ItemAddText}>Add Subcollection</div>
                </div>
              </button>
            )}
            <Ledger
              collections={collection.subcollections}
              collectionDragController={collectionDragController}
              parentCollection={collection}
              onClickItem={onClickItem}
              onToggleItem={onToggleItem}
              onToggleCollection={onToggleCollection}
              onCollectionChange={onCollectionChange}
              openCollections={openCollections}
              depth={depth + 1}
            />
          </div>
        );
      }}
    </AccordionItem>
  );
};

export default Ledger;
