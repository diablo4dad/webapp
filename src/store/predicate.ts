import { Store } from "./index";
import { DadCollection } from "../data";
import { countAllItemsInCollection } from "../data/aggregate";
import { countItemsInCollectionOwned } from "./aggregate";

export function isComplete(store: Store, collection: DadCollection): boolean {
  return (
    countAllItemsInCollection(collection) ===
    countItemsInCollectionOwned(store, collection)
  );
}
