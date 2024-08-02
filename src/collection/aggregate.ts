import { Collection, CollectionGroup } from "../data";
import { getAllCollectionItems, getDiabloItemIds } from "../data/getters";
import { CollectionLog } from "./type";
import { isItemCollected, isItemHidden } from "./predicate";

export function countItemInDbOwned(
  collectionLog: CollectionLog,
  dadDb: CollectionGroup,
): number {
  return dadDb
    .flatMap((dc) => countItemsInCollectionOwned(collectionLog, dc))
    .reduce((a, c) => a + c, 0);
}

export function countItemInDbHidden(
  collectionLog: CollectionLog,
  dadDb: CollectionGroup,
): number {
  return dadDb
    .flatMap((dc) => countItemsInCollectionHidden(collectionLog, dc))
    .reduce((a, c) => a + c, 0);
}

export function countItemsInCollectionOwned(
  collectionLog: CollectionLog,
  collection: Collection,
): number {
  return getAllCollectionItems(collection).filter((ci) => {
    return isItemCollected(collectionLog, getDiabloItemIds(ci));
  }).length;
}

export function countItemsInCollectionHidden(
  collectionLog: CollectionLog,
  collection: Collection,
): number {
  return getAllCollectionItems(collection).filter((ci) =>
    isItemHidden(collectionLog, getDiabloItemIds(ci)),
  ).length;
}
