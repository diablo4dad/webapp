import { CollectionLog } from "./type";
import { hashCode } from "../../shared/lib/hash";

export function isItemCollected(
  collection: CollectionLog,
  itemId: number[],
): boolean {
  return (
    collection.collected.includes(hashCode(itemId)) &&
    !isItemHidden(collection, itemId)
  );
}

export function isItemHidden(
  collection: CollectionLog,
  itemId: number[],
): boolean {
  return collection.hidden.includes(hashCode(itemId));
}
