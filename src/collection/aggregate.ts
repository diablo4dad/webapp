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
  return getAllCollectionItems(collection).filter((ci) =>
    ci.items.some((i) => isItemCollected(collectionLog, Number(i.itemId))),
  ).length;
}
