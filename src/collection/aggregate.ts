import { DadCollection, DadDb } from "../data";
import { getAllCollectionItems, getDiabloItemIds } from "../data/getters";
import { CollectionLog } from "./type";
import { isItemCollected, isItemHidden } from "./predicate";

export function countItemInDbOwned(
  collectionLog: CollectionLog,
  dadDb: DadDb,
): number {
  return dadDb.collections
    .flatMap((dc) => countItemsInCollectionOwned(collectionLog, dc))
    .reduce((a, c) => a + c, 0);
}

export function countItemInDbHidden(
  collectionLog: CollectionLog,
  dadDb: DadDb,
): number {
  return dadDb.collections
    .flatMap((dc) => countItemsInCollectionHidden(collectionLog, dc))
    .reduce((a, c) => a + c, 0);
}

export function countItemsInCollectionOwned(
  collectionLog: CollectionLog,
  collection: DadCollection,
): number {
  return getAllCollectionItems(collection).filter((ci) => {
    const itemIds = getDiabloItemIds(ci);
    const isCollected = isItemCollected(collectionLog, itemIds);
    const isHidden = isItemHidden(collectionLog, itemIds);
    return isCollected && !isHidden;
  }).length;
}

export function countItemsInCollectionHidden(
  collectionLog: CollectionLog,
  collection: DadCollection,
): number {
  return getAllCollectionItems(collection).filter((ci) =>
    isItemHidden(collectionLog, getDiabloItemIds(ci)),
  ).length;
}
