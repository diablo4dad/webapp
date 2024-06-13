import { Store } from "./index";
import { DadCollection } from "../data";

export function countItemsInCollectionOwned(
  store: Store,
  collection: DadCollection,
): number {
  return (
    collection.collectionItems
      .map((dci) => dci.strapiId)
      .filter(store.isCollected).length +
    collection.subcollections.reduce(
      (a, c) =>
        c.collectionItems.map((dci) => dci.strapiId).filter(store.isCollected)
          .length + a,
      0,
    )
  );
}
