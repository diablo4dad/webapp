import { AccordionItem } from "@szhsin/react-accordion";
import classNames from "classnames";
import { useMemo } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { MasterGroup } from "../common";
import type { Collection, CollectionItem } from "../data";
import { countAllItemsInCollection } from "../data/aggregate";
import { useData } from "../data/context";
import { getAllCollectionItems, getItemIds } from "../data/getters";
import { isCollectionEmpty } from "../data/predicates";
import { selectCollectionById } from "../data/reducers";
import { useEditor } from "../editor/context";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { useSettings } from "../settings/context";
import { isLedgerInverse, isLedgerView } from "../settings/predicate";
import { LedgerView } from "../settings/type";
import {
  countItemsInCollectionHidden,
  countItemsInCollectionOwned,
} from "./aggregate";
import { AddCard } from "./add-card";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./context";
import {
  ItemCard,
  ItemDragGhost,
  ItemDropPlaceholder,
} from "./item-card";
import { useItemReorder } from "./item-reorder";
import { getItemView } from "./item-view";
import type { LedgerProps, LedgerSectionProps } from "./ledger-types";
import { SectionHeader } from "./section-header";
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
  const {
    dragState,
    isReordering,
    itemListRef,
    queueItemReorder,
    renderedCollectionItemIds,
    reorderError,
    shouldSuppressItemClick,
    startItemReorder,
  } = useItemReorder({
    canReorder: canReorderCollectionItems,
    collection,
    collectionItemIds,
    db,
    setDb,
    sourceCollection,
  });
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
        <SectionHeader
          canEdit={canEditCollection}
          canReorder={canReorderCollections}
          collection={collection}
          counterLabel={counterLabel}
          descriptionLabel={descriptionLabel}
          headingLabel={headingLabel}
          isComplete={isComplete}
          onEdit={() => openCollectionEditor(collection, parentCollection)}
          onStartReorder={startCollectionReorder}
          onToggle={() => toggleCollection(collection)(!isComplete)}
        />
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

              const itemView = getItemView({
                collectionItem,
                log,
                preferredClass,
                preferredGender,
              });

              return (
                <ItemCard
                  key={collectionItem.id}
                  canReorder={canReorderCollectionItems}
                  collectionItem={collectionItem}
                  isDragging={dragState !== undefined}
                  isReordering={isReordering}
                  itemView={itemView}
                  onClick={() => {
                    if (shouldSuppressItemClick()) {
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
                itemView={getItemView({
                  collectionItem: draggedCollectionItem,
                  log,
                  preferredClass,
                  preferredGender,
                })}
              />
            )}
            {reorderError && (
              <div className={styles.ItemReorderError}>{reorderError}</div>
            )}
            {shouldRenderAddItemCard && (
              <AddCard
                label="Add Item"
                onClick={() => openCollectionItemEditor(collection)}
              />
            )}
            {shouldRenderAddSubcollectionCard && (
              <AddCard
                label="Add Subcollection"
                onClick={() => openCollectionCreator(collection, group)}
              />
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
