import { MasterGroup } from "../../shared/domain";
import type { Collection } from "../../services/data";

type Options = {
  collection: Collection;
  depth: number;
  group: MasterGroup;
  hasCollectionDragController: boolean;
  isEditMode: boolean;
  parentCollection?: Collection;
  searchTerm: string;
  sourceCollection?: Collection;
};

type LedgerGroupRules = {
  canAddCollectionItems: boolean;
  canAddSubcollections: boolean;
  canEditCollection: boolean;
  canReorderCollectionItems: boolean;
  canReorderCollections: boolean;
  shouldRenderAddItemCard: boolean;
  shouldRenderAddSubcollectionCard: boolean;
};

function getLedgerGroupRules({
  collection,
  depth,
  group,
  hasCollectionDragController,
  isEditMode,
  parentCollection,
  searchTerm,
  sourceCollection,
}: Options): LedgerGroupRules {
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
    hasCollectionDragController &&
    group !== MasterGroup.UNIVERSAL;
  const canReorderCollectionItems =
    isEditableCatalogCollection &&
    searchTerm.trim() === "" &&
    sourceCollection !== undefined &&
    collection.collectionItems.length > 1 &&
    collection.collectionItems.length ===
      sourceCollection.collectionItems.length;

  return {
    canAddCollectionItems,
    canAddSubcollections,
    canEditCollection,
    canReorderCollectionItems,
    canReorderCollections,
    shouldRenderAddItemCard,
    shouldRenderAddSubcollectionCard,
  };
}

export { getLedgerGroupRules };
export type { LedgerGroupRules };
