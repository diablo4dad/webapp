import { Collection, CollectionGroup } from "./index";

export function countAllItemsDabDb(db: CollectionGroup): number {
  return db.reduce((a, c) => countAllItemsInCollection(c) + a, 0);
}

export function countAllItemsInCollection(collection: Collection): number {
  return (
    countItemsInCollection(collection) + countItemsInSubcollection(collection)
  );
}

export function countItemsInCollection(collection: Collection): number {
  return collection.collectionItems.length;
}

export function countItemsInSubcollection(collection: Collection): number {
  return collection.subcollections.reduce(
    (a, c) => a + countItemsInCollection(c),
    0,
  );
}
