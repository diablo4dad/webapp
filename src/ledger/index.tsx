import { useMemo } from "react";
import { useData } from "../data/context";
import { useEditor } from "../editor/context";
import { LedgerGroup } from "./ledger-group";
import { getCollectionListIds } from "./order";
import { useCollectionReorder } from "./reorder";
import {
  getAddCollectionState,
  getRenderedCollectionIds,
} from "./state";
import type { LedgerProps } from "./types";
import { LedgerView } from "./view";

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
  const {
    addCollectionLabel,
    addCollectionParent,
    canAddCollection,
  } = getAddCollectionState({
    depth,
    group,
    isEditMode,
    parentCollection,
    searchTerm,
  });
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
  const renderedCollectionIds = getRenderedCollectionIds({
    collectionDragState: activeCollectionDragController.collectionDragState,
    collectionIds,
    collectionParentId,
  });

  return (
    <LedgerView
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
        <LedgerGroup
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
