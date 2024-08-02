import { CollectionGroup, CollectionItem } from "./index";

export function flattenDadDb(db: CollectionGroup): CollectionItem[] {
  return db.flatMap((c) => [
    ...c.collectionItems,
    ...c.subcollections.flatMap((sc) => sc.collectionItems),
  ]);
}
