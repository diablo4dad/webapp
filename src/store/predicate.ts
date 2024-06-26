import { Store } from "./index";
import { DadCollection, DadCollectionItem } from "../data";
import { countAllItemsInCollection } from "../data/aggregate";
import { countItemsInCollectionOwned } from "./aggregate";

export function isComplete(store: Store, collection: DadCollection): boolean {
  return (
    countAllItemsInCollection(collection) ===
    countItemsInCollectionOwned(store, collection)
  );
}

export function isItemCollected(store: Store, dci: DadCollectionItem): boolean {
  return dci.items
    .map((i) => i.itemId)
    .map(Number)
    .some(store.isCollected);
}

export function isItemHidden(store: Store, dci: DadCollectionItem): boolean {
  return dci.items
    .map((i) => i.itemId)
    .map(Number)
    .some(store.isHidden);
}
