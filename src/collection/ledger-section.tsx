import { AccordionItem } from "@szhsin/react-accordion";
import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { MasterGroup } from "../common";
import btnStyles from "../components/Button.module.css";
import { GripVertical, Pencil, Plus, Tick } from "../components/Icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/Tooltip";
import { getDefaultItem, type Collection, type CollectionItem } from "../data";
import { countAllItemsInCollection } from "../data/aggregate";
import { useData } from "../data/context";
import {
  getAllCollectionItems,
  getClassIconVariant,
  getClassItemVariant,
  getItemIds,
} from "../data/getters";
import { isCollectionEmpty } from "../data/predicates";
import { selectCollectionById } from "../data/reducers";
import { useEditor } from "../editor/context";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { useSettings } from "../settings/context";
import { isLedgerInverse, isLedgerView } from "../settings/predicate";
import { LedgerView } from "../settings/type";
import { updateCatalogCollectionItemOrder } from "../store/catalog";
import {
  countItemsInCollectionHidden,
  countItemsInCollectionOwned,
} from "./aggregate";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./context";
import {
  createDragAutoScroller,
  getDragScrollTarget,
  getItemInsertIndexFromPointer,
  type DragScrollTarget,
} from "./drag";
import {
  ItemCard,
  ItemDragGhost,
  ItemDropPlaceholder,
  type ItemView,
} from "./item-card";
import type {
  ItemDragState,
  LedgerProps,
  LedgerSectionProps,
} from "./ledger-types";
import { isItemCollected, isItemHidden } from "./predicate";
import {
  areItemOrdersEqual,
  moveItemIdToIndex,
  reorderCollectionItemsInDb,
} from "./reorder";
import styles from "./Ledger.module.css";

type Props = LedgerSectionProps & {
  renderSubcollections: (props: LedgerProps) => ReactNode;
};

const LedgerSection = ({
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
  renderSubcollections,
}: Props) => {
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

  function getCollectionItemView(collectionItem: CollectionItem): ItemView {
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
    const showExcluded = isHidden || collectionItem.unobtainable === true;

    return {
      icon,
      isCollected,
      item,
      showCollected,
      showExcluded,
    };
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
                  <ItemDropPlaceholder
                    key={`drop-placeholder-${collectionItemId}`}
                  />
                );
              }

              const collectionItem = collectionItemsById.get(collectionItemId);
              if (!collectionItem) {
                return null;
              }

              const itemView = getCollectionItemView(collectionItem);

              return (
                <ItemCard
                  key={collectionItem.id}
                  canReorder={canReorderCollectionItems}
                  collectionItem={collectionItem}
                  isDragging={dragState !== undefined}
                  isReordering={isReordering}
                  itemView={itemView}
                  onClick={() => {
                    if (suppressItemClickRef.current) {
                      suppressItemClickRef.current = false;
                      return;
                    }

                    if (!dragState) {
                      onClickItem(collectionItem, collection);
                    }
                  }}
                  onQueueReorder={(event) =>
                    queueItemReorder(event, collectionItem)
                  }
                  onStartReorder={(event) =>
                    startItemReorder(event, collectionItem)
                  }
                  onToggle={() =>
                    toggleItem(collectionItem)(!itemView.isCollected)
                  }
                />
              );
            })}
            {dragState && draggedCollectionItem && (
              <ItemDragGhost
                collectionItem={draggedCollectionItem}
                dragState={dragState}
                itemView={getCollectionItemView(draggedCollectionItem)}
              />
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
            {renderSubcollections({
              collections: collection.subcollections,
              collectionDragController,
              parentCollection: collection,
              onClickItem,
              onToggleItem,
              onToggleCollection,
              onCollectionChange,
              openCollections,
              depth: depth + 1,
            })}
          </div>
        );
      }}
    </AccordionItem>
  );
};

export { LedgerSection };
