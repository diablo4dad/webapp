import { AccordionItem } from "@szhsin/react-accordion";
import classNames from "classnames";
import { useMemo } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useData } from "../data/context";
import { isCollectionEmpty } from "../data/predicates";
import { selectCollectionById } from "../data/reducers";
import { useEditor } from "../editor";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { useSettings } from "../settings/context";
import { isLedgerInverse, isLedgerView } from "../settings/predicate";
import { LedgerView } from "../settings/type";
import { LedgerGroupAddCard } from "./ledger-group-add-card";
import { useCollection } from "./context";
import { useLedgerGroupItemReorder } from "./ledger-group-item-reorder";
import type { LedgerGroupProps, LedgerProps } from "./types";
import { LedgerGroupHeader } from "./ledger-group-header";
import { LedgerGroupItems } from "./ledger-group-items";
import { getLedgerGroupRules } from "./ledger-group-rules";
import { getLedgerGroupState } from "./ledger-group-state";
import { useLedgerGroupToggles } from "./ledger-group-toggles";
import styles from "./ledger-group.module.css";

type Props = LedgerGroupProps & {
  renderSubcollections: (props: LedgerProps) => ReactNode;
};

const LedgerGroup = ({
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
  const { toggleCollection, toggleItem } = useLedgerGroupToggles({
    onToggleCollection,
    onToggleItem,
  });
  const {
    counterLabel,
    descriptionLabel,
    headingLabel,
    isComplete,
    isOpen: ledgerIsOpen,
  } = getLedgerGroupState({
    collection,
    log,
    openCollections,
    parentCollection,
  });

  const isCardView = isLedgerView(settings, LedgerView.CARD);
  const isInverseCardView = isLedgerInverse(settings);
  const className = classNames({
    [styles.LedgerGroup]: true,
    [styles.LedgerGroupCards]: isCardView,
  });
  const {
    canEditCollection,
    canReorderCollectionItems,
    canReorderCollections,
    shouldRenderAddItemCard,
    shouldRenderAddSubcollectionCard,
  } = getLedgerGroupRules({
    collection,
    depth,
    group,
    hasCollectionDragController: collectionDragController !== undefined,
    isEditMode,
    parentCollection,
    searchTerm,
    sourceCollection,
  });
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
  } = useLedgerGroupItemReorder({
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
        className: styles.LedgerGroupHeader,
      }}
      buttonProps={{
        className: classNames(styles.LedgerGroupButton, {
          [styles.LedgerGroupReorderSaving]:
            collectionDragController?.collectionReordering,
        }),
      }}
      contentProps={{
        className: styles.LedgerGroupContent,
      }}
      header={
        <LedgerGroupHeader
          canEdit={canEditCollection}
          canReorder={canReorderCollections}
          collection={collection}
          counterLabel={counterLabel}
          descriptionLabel={descriptionLabel}
          headingLabel={headingLabel}
          isComplete={isComplete}
          isSubcollection={depth > 0}
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
            data-ledger-inverse={isInverseCardView ? "true" : undefined}
            data-ledger-view={isCardView ? "card" : "list"}
            className={
              collection.subcollections.length
                ? styles.LedgerGroupSubcollection
                : styles.LedgerGroupRow
            }
          >
            <LedgerGroupItems
              canReorder={canReorderCollectionItems}
              collectionItemsById={collectionItemsById}
              dragState={dragState}
              draggedCollectionItem={draggedCollectionItem}
              isReordering={isReordering}
              log={log}
              onClickItem={(collectionItem) =>
                onClickItem(collectionItem, collection)
              }
              onQueueReorder={queueItemReorder}
              onStartReorder={startItemReorder}
              onToggleItem={(collectionItem, isCollected) =>
                toggleItem(collectionItem)(isCollected)
              }
              preferredClass={preferredClass}
              preferredGender={preferredGender}
              renderedCollectionItemIds={renderedCollectionItemIds}
              shouldSuppressItemClick={shouldSuppressItemClick}
            />
            {reorderError && (
              <div className={styles.LedgerGroupItemReorderError}>
                {reorderError}
              </div>
            )}
            {shouldRenderAddItemCard && (
              <LedgerGroupAddCard
                label="Add Item"
                onClick={() => openCollectionItemEditor(collection)}
              />
            )}
            {shouldRenderAddSubcollectionCard && (
              <LedgerGroupAddCard
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

export { LedgerGroup };
