import { DadCollection, DadDb } from "./index";

export function countAllItemsDabDb(db: DadDb): number {
  return db.collections.reduce((a, c) => countAllItemsInCollection(c) + a, 0);
}

export function countAllItemsInCollection(collection: DadCollection): number {
  return (
    countItemsInCollection(collection) + countItemsInSubcollection(collection)
  );
}

export function countItemsInCollection(collection: DadCollection): number {
  return collection.collectionItems.length;
}

export function countItemsInSubcollection(collection: DadCollection): number {
  return collection.subcollections.reduce(
    (a, c) => a + countItemsInCollection(c),
    0,
  );
}
