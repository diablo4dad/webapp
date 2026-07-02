import { useMemo } from "react";
import { MasterGroup } from "../common";
import { useData } from "../data/context";
import { useEditor } from "../editor/context";
import { useCollectionReorder } from "./collection-reorder";
import { LedgerListView } from "./ledger-list";
import { LedgerSection } from "./ledger-section";
import type { LedgerProps } from "./ledger-types";
import {
  getCollectionListIds,
  moveCollectionIdToIndex,
} from "./reorder";

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
  const {
    activeCollectionDragController,
    draggedCollection,
    isCollectionDragRoot,
  } = useCollectionReorder({
    collectionDragController,
    db,
    group,
    searchTerm,
    setDb,
  });
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
