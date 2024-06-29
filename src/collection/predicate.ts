import { CollectionLog } from "./type";

export function isCollected(
  collection: CollectionLog,
  itemId: number,
): boolean {
  return collection.collected.includes(itemId);
}

export function isHidden(collection: CollectionLog, itemId: number): boolean {
  return collection.hidden.includes(itemId);
}
