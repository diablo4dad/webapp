import { Store } from "./index";
import { DadCollection } from "../data";
import { getAllCollectionItems } from "../data/getters";
import { isItemCollected } from "./predicate";

export function countItemsInCollectionOwned(
  store: Store,
  collection: DadCollection,
): number {
  return getAllCollectionItems(collection).filter((ci) =>
    isItemCollected(store, ci),
  ).length;
}
