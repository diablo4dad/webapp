import { CollectionLog } from "./type";

export function isItemCollected(
  collection: CollectionLog,
  itemId: number,
): boolean {
  return collection.collected.includes(itemId);
}

export function isItemHidden(
  collection: CollectionLog,
  itemId: number,
): boolean {
  return collection.hidden.includes(itemId);
}
