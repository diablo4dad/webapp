import { DadCollection, DadDb } from "../data";
import { getAllCollectionItems } from "../data/getters";
import { CollectionLog } from "./type";
import { isItemCollected } from "./predicate";

export function countItemInDbOwned(
  collectionLog: CollectionLog,
  dadDb: DadDb,
): number {
  return dadDb.collections
    .flatMap((dc) => countItemsInCollectionOwned(collectionLog, dc))
    .reduce((a, c) => a + c, 0);
}

export function countItemsInCollectionOwned(
  collectionLog: CollectionLog,
  collection: DadCollection,
): number {
  return getAllCollectionItems(collection)
    .flatMap((ci) => ci.items)
    .map((i) => i.itemId)
    .map(Number)
    .reduce((a, c) => (isItemCollected(collectionLog, c) ? a + 1 : a), 0);
}
