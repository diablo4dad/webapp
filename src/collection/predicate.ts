import { CollectionLog } from "./type";
import { hashCode } from "../common/hash";

export function isItemCollected(
  collection: CollectionLog,
  itemId: number[],
): boolean {
  return collection.collected.includes(hashCode(itemId));
}

export function isItemHidden(
  collection: CollectionLog,
  itemId: number[],
): boolean {
  return collection.hidden.includes(hashCode(itemId));
}
