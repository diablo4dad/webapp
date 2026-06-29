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
  updateCatalogCollectionNodeOrder,
  updateCatalogCollectionItemOrder,
} from "../store/catalog";

type Props = {
  collections: Collection[];
  collectionDragController?: CollectionDragController;
  parentCollection?: Collection;
  onClickItem: (item: CollectionItem, collection: Collection) => void;
  onToggleItem?: (item: CollectionItem) => void;
  onToggleCollection?: (collection: Collection) => void;
  onCollectionChange: (collectionId: string, isOpen: boolean) => void;
  openCollections: string[];
  depth?: number;
};

type PropsInner = Props & {
  collection: Collection;
  collectionIndex: number;
  collectionSiblingIds: string[];
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

type CollectionParentId = string | null;

type CollectionDragState = {
  category: MasterGroup;
  collectionId: string;
  height: number;
  offsetX: number;
  offsetY: number;
  pointerX: number;
  pointerY: number;
  sourceParentId: CollectionParentId;
  sourceSiblingIds: string[];
  targetIndex: number;
  targetParentId: CollectionParentId;
  targetSiblingIds: string[];
  width: number;
};

type CollectionDragController = {
  beginCollectionReorder: (
    collection: Collection,
    parentCollection: Collection | undefined,
    sourceIndex: number,
    sourceSiblingIds: string[],
    element: HTMLElement,
    pointerX: number,
    pointerY: number,
  ) => void;
  collectionDragError?: string;
  collectionDragState?: CollectionDragState;
  collectionReordering: boolean;
};

type DragScrollTarget = HTMLElement | Window;

const DRAG_AUTO_SCROLL_EDGE_SIZE = 96;
const DRAG_AUTO_SCROLL_MAX_SPEED = 14;

function getDragScrollTarget(element: HTMLElement): DragScrollTarget {
  let candidate = element.parentElement;

  while (candidate) {
    const { overflowY } = window.getComputedStyle(candidate);
    const canScroll =
      ["auto", "scroll", "overlay"].includes(overflowY) &&
      candidate.scrollHeight > candidate.clientHeight;

    if (canScroll) {
      return candidate;
    }

    candidate = candidate.parentElement;
  }

  return window;
}

function getDragScrollMetrics(scrollTarget: DragScrollTarget) {
  if (scrollTarget === window) {
    const scrollingElement =
      document.scrollingElement ?? document.documentElement;

    return {
      bottom: window.innerHeight,
      maxScrollTop: Math.max(
        0,
        scrollingElement.scrollHeight - window.innerHeight,
      ),
      scrollTop: window.scrollY,
      top: 0,
    };
  }

  const element = scrollTarget as HTMLElement;
  const rect = element.getBoundingClientRect();

  return {
    bottom: rect.bottom,
    maxScrollTop: Math.max(0, element.scrollHeight - element.clientHeight),
    scrollTop: element.scrollTop,
    top: rect.top,
  };
}

function getDragAutoScrollVelocity(
  scrollTarget: DragScrollTarget,
  pointerY: number,
): number {
  const { bottom, maxScrollTop, scrollTop, top } =
    getDragScrollMetrics(scrollTarget);

  if (maxScrollTop <= 0) {
    return 0;
  }

  const topDistance = pointerY - top;
  if (topDistance < DRAG_AUTO_SCROLL_EDGE_SIZE && scrollTop > 0) {
    const intensity =
      (DRAG_AUTO_SCROLL_EDGE_SIZE - Math.max(0, topDistance)) /
      DRAG_AUTO_SCROLL_EDGE_SIZE;

    return -Math.ceil(intensity * DRAG_AUTO_SCROLL_MAX_SPEED);
  }

  const bottomDistance = bottom - pointerY;
  if (bottomDistance < DRAG_AUTO_SCROLL_EDGE_SIZE && scrollTop < maxScrollTop) {
    const intensity =
      (DRAG_AUTO_SCROLL_EDGE_SIZE - Math.max(0, bottomDistance)) /
      DRAG_AUTO_SCROLL_EDGE_SIZE;

    return Math.ceil(intensity * DRAG_AUTO_SCROLL_MAX_SPEED);
  }

  return 0;
}

function scrollDragTargetBy(
  scrollTarget: DragScrollTarget,
  scrollDelta: number,
) {
  if (scrollTarget === window) {
    window.scrollBy(0, scrollDelta);
    return;
  }

  (scrollTarget as HTMLElement).scrollTop += scrollDelta;
}

function createDragAutoScroller(
  scrollTarget: DragScrollTarget | undefined,
  onAutoScroll?: () => void,
) {
  let frameId: number | undefined;
  let isActive = true;
  let pointerY = 0;

  function schedule() {
    if (frameId === undefined) {
      frameId = window.requestAnimationFrame(tick);
    }
  }

  function tick() {
    frameId = undefined;

    if (!isActive || !scrollTarget) {
      return;
    }

    const velocity = getDragAutoScrollVelocity(scrollTarget, pointerY);
    if (velocity === 0) {
      return;
    }

    scrollDragTargetBy(scrollTarget, velocity);
    onAutoScroll?.();
    schedule();
  }

  return {
    stop() {
      isActive = false;

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
        frameId = undefined;
      }
    },
    update(nextPointerY: number) {
      pointerY = nextPointerY;
      schedule();
    },
  };
}

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

function areCollectionOrdersEqual(a: string[], b: string[]): boolean {
  return (
    a.length === b.length &&
    a.every((collectionId, index) => collectionId === b[index])
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
  collectionId: string,
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
  collectionId: string,
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

function removeCollectionFromTree(
  collections: Collection[],
  collectionId: string,
): { collections: Collection[]; removed?: Collection } {
  let removed: Collection | undefined;
  const nextCollections: Collection[] = [];

  for (const collection of collections) {
    if (collection.id === collectionId) {
      removed = collection;
      continue;
    }

    const subcollectionResult = removeCollectionFromTree(
      collection.subcollections,
      collectionId,
    );

    if (subcollectionResult.removed) {
      removed = subcollectionResult.removed;
      nextCollections.push({
        ...collection,
        subcollections: subcollectionResult.collections,
      });
      continue;
    }

    nextCollections.push(collection);
  }

  return {
    collections: nextCollections,
    removed,
  };
}

function reorderCollectionsById(
  collections: Collection[],
  orderedCollectionIds: string[],
): Collection[] {
  const collectionsById = new Map(
    collections.map((collection) => [collection.id, collection]),
  );

  return orderedCollectionIds
    .map((collectionId) => collectionsById.get(collectionId))
    .filter((collection): collection is Collection => Boolean(collection));
}

function replaceCategoryRoots(
  collections: Collection[],
  category: MasterGroup,
  orderedCategoryRoots: Collection[],
): Collection[] {
  const orderedRootIds = new Set(
    orderedCategoryRoots.map((collection) => collection.id),
  );
  const nextCollections: Collection[] = [];
  let didInsertOrderedRoots = false;

  for (const collection of collections) {
    const isCategoryRoot =
      collection.category === category || orderedRootIds.has(collection.id);

    if (isCategoryRoot) {
      if (!didInsertOrderedRoots) {
        nextCollections.push(...orderedCategoryRoots);
        didInsertOrderedRoots = true;
      }

      continue;
    }

    nextCollections.push(collection);
  }

  if (!didInsertOrderedRoots) {
    nextCollections.push(...orderedCategoryRoots);
  }

  return nextCollections;
}

function insertCollectionIntoParent(
  collections: Collection[],
  parentId: string,
  movedCollection: Collection,
  orderedSiblingIds: string[],
): { collections: Collection[]; didInsert: boolean } {
  let didInsert = false;

  const nextCollections = collections.map((collection) => {
    if (collection.id === parentId) {
      didInsert = true;
      const siblings = [
        ...collection.subcollections,
        {
          ...movedCollection,
          category: undefined,
        },
      ];

      return {
        ...collection,
        subcollections: reorderCollectionsById(siblings, orderedSiblingIds),
      };
    }

    const result = insertCollectionIntoParent(
      collection.subcollections,
      parentId,
      movedCollection,
      orderedSiblingIds,
    );

    if (!result.didInsert) {
      return collection;
    }

    didInsert = true;

    return {
      ...collection,
      subcollections: result.collections,
    };
  });

  return {
    collections: nextCollections,
    didInsert,
  };
}

function moveCollectionInDb(
  dadDb: DadDb,
  collectionId: string,
  targetParentId: CollectionParentId,
  orderedSiblingIds: string[],
  category: MasterGroup,
): DadDb {
  const removeResult = removeCollectionFromTree(
    dadDb.collections,
    collectionId,
  );

  if (!removeResult.removed) {
    return dadDb;
  }

  if (targetParentId === null) {
    const movedRoot: Collection = {
      ...removeResult.removed,
      category,
    };
    const categoryRoots = removeResult.collections
      .filter((collection) => collection.category === category)
      .concat(movedRoot);
    const orderedCategoryRoots = reorderCollectionsById(
      categoryRoots,
      orderedSiblingIds,
    );

    return {
      ...dadDb,
      collections: replaceCategoryRoots(
        removeResult.collections,
        category,
        orderedCategoryRoots,
      ),
    };
  }

  const movedSubcollection: Collection = {
    ...removeResult.removed,
    category: undefined,
  };
  const insertResult = insertCollectionIntoParent(
    removeResult.collections,
    targetParentId,
    movedSubcollection,
    orderedSiblingIds,
  );

  if (!insertResult.didInsert) {
    return dadDb;
  }

  return {
    ...dadDb,
    collections: insertResult.collections,
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

function getCollectionInsertIndexFromPointer(
  container: HTMLElement,
  pointerY: number,
): number {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>(
      "[data-collection-reorder-item='true']",
    ),
  ).filter(
    (item) => item.closest("[data-collection-drop-list='true']") === container,
  );

  if (items.length === 0) {
    return 0;
  }

  const targetIndex = items.findIndex((item) => {
    const rect = item.getBoundingClientRect();

    return pointerY < rect.top + rect.height / 2;
  });

  return targetIndex === -1 ? items.length : targetIndex;
}

function getCollectionListIds(collections: Collection[]): string[] {
  return collections.map((collection) => collection.id);
}

function moveCollectionIdToIndex(
  collectionIds: string[],
  collectionId: string,
  insertIndex: number,
): string[] {
  const nextCollectionIds = collectionIds.filter(
    (candidateId) => candidateId !== collectionId,
  );
  const nextInsertIndex = Math.max(
    0,
    Math.min(insertIndex, nextCollectionIds.length),
  );

  nextCollectionIds.splice(nextInsertIndex, 0, collectionId);

  return nextCollectionIds;
}

function getCollectionIdsForDropList(listElement: HTMLElement): string[] {
  return Array.from(
    listElement.querySelectorAll<HTMLElement>(
      "[data-collection-reorder-item='true']",
    ),
  )
    .filter(
      (itemElement) =>
        itemElement.closest("[data-collection-drop-list='true']") ===
        listElement,
    )
    .map((itemElement) => itemElement.dataset.collectionId)
    .filter((collectionId): collectionId is string => Boolean(collectionId));
}

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
}: Props) => {
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
    <div
      className={styles.CollectionList}
      data-collection-category={group}
      data-collection-drop-list="true"
      data-collection-parent-id={collectionParentId ?? "root"}
    >
      <Accordion
        transition
        transitionTimeout={250}
        allowMultiple
        onStateChange={(e) => {
          if (e.current.isResolved) {
            onCollectionChange(String(e.key), e.current.isEnter);
          }
        }}
      >
        {renderedCollectionIds.map((collectionId) => {
          if (
            activeCollectionDragController.collectionDragState?.collectionId ===
              collectionId &&
            activeCollectionDragController.collectionDragState
              .targetParentId === collectionParentId
          ) {
            return (
              <div
                key={`collection-placeholder-${collectionId}`}
                className={styles.CollectionDropPlaceholder}
                style={
                  {
                    "--collection-placeholder-height": `${
                      activeCollectionDragController.collectionDragState.height
                    }px`,
                  } as CSSProperties
                }
              />
            );
          }

          const collection = collectionsById.get(collectionId);
          if (!collection) {
            return null;
          }

          return (
            <LedgerInner
              key={collection.id}
              collection={collection}
              collectionDragController={activeCollectionDragController}
              collectionIndex={collectionIds.indexOf(collection.id)}
              collectionSiblingIds={collectionIds}
              collections={collections}
              depth={depth}
              parentCollection={parentCollection}
              openCollections={openCollections}
              onCollectionChange={onCollectionChange}
              onClickItem={onClickItem}
              onToggleItem={onToggleItem}
              onToggleCollection={onToggleCollection}
            />
          );
        })}
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
      {isCollectionDragRoot && collectionDragError && (
        <div className={styles.CollectionReorderError}>
          {collectionDragError}
        </div>
      )}
      {isCollectionDragRoot && collectionDragState && draggedCollection && (
        <div
          className={styles.CollectionDragGhost}
          style={{
            height: collectionDragState.height,
            left: collectionDragState.pointerX - collectionDragState.offsetX,
            top: collectionDragState.pointerY - collectionDragState.offsetY,
            width: collectionDragState.width,
          }}
        >
          <span className={styles.CollectionDragHandle}>
            <GripVertical />
          </span>
          <div>
            <h1 className={styles.LedgerTitle}>
              <span className={styles.LedgerCollectionName}>
                {draggedCollection.name}
              </span>
            </h1>
            <div className={styles.LedgerDescription}>
              {draggedCollection.description}
            </div>
          </div>
        </div>
      )}
    </div>
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
