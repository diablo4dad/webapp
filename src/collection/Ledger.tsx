import { FallbackLazyImage } from "../components/LazyLoadImageFallback";
import {
  Collection,
  CollectionItem,
  DadDb,
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
import { LazyLoadImage } from "react-lazy-load-image-component";
import placeholder from "../image/placeholder.webp";
import { Accordion, AccordionItem } from "@szhsin/react-accordion";
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
  fetchHybridDadDbRef,
  updateCatalogCollectionItemOrder,
} from "../store/catalog";
import { hydrateDadDb } from "../data/factory";

type Props = {
  collections: Collection[];
  parentCollection?: Collection;
  onClickItem: (item: CollectionItem, collection: Collection) => void;
  onToggleItem?: (item: CollectionItem) => void;
  onToggleCollection?: (collection: Collection) => void;
  onCollectionChange: (collectionId: number, isOpen: boolean) => void;
  openCollections: number[];
  depth?: number;
};

type PropsInner = Props & {
  collection: Collection;
};

type ItemDragState = {
  draggedItemId: number;
  height: number;
  insertIndex: number;
  offsetX: number;
  offsetY: number;
  pointerX: number;
  pointerY: number;
  width: number;
};

function moveItemIdToIndex(
  itemIds: number[],
  itemId: number,
  insertIndex: number,
): number[] {
  const nextItemIds = itemIds.filter((candidateId) => candidateId !== itemId);
  const nextInsertIndex = Math.max(
    0,
    Math.min(insertIndex, nextItemIds.length),
  );

  nextItemIds.splice(nextInsertIndex, 0, itemId);

  return nextItemIds;
}

function areItemOrdersEqual(a: number[], b: number[]): boolean {
  return (
    a.length === b.length && a.every((itemId, index) => itemId === b[index])
  );
}

function reorderCollectionItemsById(
  collectionItems: CollectionItem[],
  orderedCollectionItemIds: number[],
): CollectionItem[] {
  const collectionItemsById = collectionItems.reduce(
    (lookup, collectionItem) => {
      const items = lookup.get(collectionItem.id) ?? [];
      items.push(collectionItem);
      lookup.set(collectionItem.id, items);

      return lookup;
    },
    new Map<number, CollectionItem[]>(),
  );

  return orderedCollectionItemIds
    .map((collectionItemId) =>
      collectionItemsById.get(collectionItemId)?.shift(),
    )
    .filter((collectionItem): collectionItem is CollectionItem =>
      Boolean(collectionItem),
    );
}

function reorderCollectionItemsInCollections(
  collections: Collection[],
  collectionId: number,
  orderedCollectionItemIds: number[],
): { collections: Collection[]; didUpdate: boolean } {
  let didUpdate = false;

  const nextCollections = collections.map((collection) => {
    if (!didUpdate && collection.id === collectionId) {
      didUpdate = true;

      return {
        ...collection,
        collectionItems: reorderCollectionItemsById(
          collection.collectionItems,
          orderedCollectionItemIds,
        ),
      };
    }

    if (didUpdate) {
      return collection;
    }

    const subcollectionResult = reorderCollectionItemsInCollections(
      collection.subcollections,
      collectionId,
      orderedCollectionItemIds,
    );

    if (!subcollectionResult.didUpdate) {
      return collection;
    }

    didUpdate = true;

    return {
      ...collection,
      subcollections: subcollectionResult.collections,
    };
  });

  return {
    collections: nextCollections,
    didUpdate,
  };
}

function reorderCollectionItemsInDb(
  dadDb: DadDb,
  collectionId: number,
  orderedCollectionItemIds: number[],
): DadDb {
  const result = reorderCollectionItemsInCollections(
    dadDb.collections,
    collectionId,
    orderedCollectionItemIds,
  );

  if (!result.didUpdate) {
    return dadDb;
  }

  return {
    ...dadDb,
    collections: result.collections,
  };
}

function getItemInsertIndexFromPointer(
  container: HTMLElement,
  pointerX: number,
  pointerY: number,
): number {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>("[data-reorder-item='true']"),
  );

  if (items.length === 0) {
    return 0;
  }

  const isGrid = window.getComputedStyle(container).display === "grid";
  if (!isGrid) {
    const targetIndex = items.findIndex((item) => {
      const rect = item.getBoundingClientRect();

      return pointerY < rect.top + rect.height / 2;
    });

    return targetIndex === -1 ? items.length : targetIndex;
  }

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance =
      Math.pow(pointerX - centerX, 2) + Math.pow(pointerY - centerY, 2);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  const closestRect = items[closestIndex].getBoundingClientRect();
  const isAfterClosest =
    pointerY > closestRect.top + closestRect.height / 2 ||
    (pointerY >= closestRect.top &&
      pointerY <= closestRect.bottom &&
      pointerX > closestRect.left + closestRect.width / 2);

  return Math.max(
    0,
    Math.min(closestIndex + (isAfterClosest ? 1 : 0), items.length),
  );
}

const Ledger = ({
  collections,
  parentCollection,
  onClickItem,
  onToggleItem,
  onToggleCollection,
  onCollectionChange,
  openCollections,
  depth = 0,
}: Props) => {
  const { group, searchTerm } = useData();
  const { isEditMode, openCollectionCreator } = useEditor();
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

  return (
    <>
      <Accordion
        transition
        transitionTimeout={250}
        allowMultiple
        onStateChange={(e) => {
          if (e.current.isResolved) {
            onCollectionChange(Number(e.key), e.current.isEnter);
          }
        }}
      >
        {collections.map((collection) => (
          <LedgerInner
            key={collection.id}
            collection={collection}
            collections={collections}
            depth={depth}
            parentCollection={parentCollection}
            openCollections={openCollections}
            onCollectionChange={onCollectionChange}
            onClickItem={onClickItem}
            onToggleItem={onToggleItem}
            onToggleCollection={onToggleCollection}
          />
        ))}
      </Accordion>
      {canAddCollection && (
        <button
          type="button"
          className={styles.CollectionAdd}
          onClick={() => openCollectionCreator(addCollectionParent, group)}
        >
          <span className={styles.CollectionAddIcon}>
            <Plus />
          </span>
          <span>{addCollectionLabel}</span>
        </button>
      )}
    </>
  );
};

const LedgerInner = ({
  collection,
  depth = 0,
  parentCollection,
  onClickItem,
  onToggleItem,
  onToggleCollection,
  onCollectionChange,
  openCollections,
}: PropsInner) => {
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
  const toggleCountDown = useRef<NodeJS.Timeout | undefined>();
  const itemListRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<ItemDragState>();
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
    collection.id !== 888 &&
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

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  async function refreshDb() {
    const dadDbRef = await fetchHybridDadDbRef();
    setDb(hydrateDadDb(dadDbRef));
  }

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

    try {
      await refreshDb();
    } catch (error) {
      setReorderError(
        error instanceof Error
          ? `Saved order, but failed to refresh database: ${error.message}`
          : "Saved order, but failed to refresh database.",
      );
    } finally {
      setIsReordering(false);
    }
  }

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    function onPointerMove(event: PointerEvent) {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) {
        return;
      }

      event.preventDefault();
      const insertIndex = itemListRef.current
        ? getItemInsertIndexFromPointer(
            itemListRef.current,
            event.clientX,
            event.clientY,
          )
        : currentDragState.insertIndex;

      const nextDragState = {
        ...currentDragState,
        insertIndex,
        pointerX: event.clientX,
        pointerY: event.clientY,
      };

      dragStateRef.current = nextDragState;
      setDragState(nextDragState);
    }

    function onPointerUp(event: PointerEvent) {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) {
        return;
      }

      event.preventDefault();
      void commitItemReorder(currentDragState);
    }

    function onPointerCancel() {
      dragStateRef.current = undefined;
      setDragState(undefined);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
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
      initialEntered={ledgerIsOpen || collection.id === 888}
      itemKey={collection.id}
      className={className}
      headingProps={{
        className: styles.LedgerHeader,
      }}
      buttonProps={{
        className: styles.LedgerButton,
      }}
      contentProps={{
        className: styles.LedgerContent,
      }}
      header={
        <>
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
        </>
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
