import type { MasterGroup } from "../common";
import type { Collection, CollectionItem, DadDb } from "../data";

type CollectionParentId = string | null;

type CollectionItemsResult = {
  collections: Collection[];
  didUpdate: boolean;
};

type CollectionInsertResult = {
  collections: Collection[];
  didInsert: boolean;
};

type CollectionRemoveResult = {
  collections: Collection[];
  removed?: Collection;
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

function getCollectionListIds(collections: Collection[]): string[] {
  return collections.map((collection) => collection.id);
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
): CollectionItemsResult {
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

function removeCollectionFromTree(
  collections: Collection[],
  collectionId: string,
): CollectionRemoveResult {
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
): CollectionInsertResult {
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

export {
  areCollectionOrdersEqual,
  areItemOrdersEqual,
  getCollectionListIds,
  moveCollectionIdToIndex,
  moveCollectionInDb,
  moveItemIdToIndex,
  reorderCollectionItemsInDb,
};
export type { CollectionParentId };
