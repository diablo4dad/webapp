import { CollectionLog } from "./type";

export function isItemCollected(
  collection: CollectionLog,
  itemId: number[],
): boolean {
  return itemId.every((i) => collection.collected.includes(i));
}

export function isItemHidden(
  collection: CollectionLog,
  itemId: number[],
): boolean {
  return itemId.every((i) => collection.hidden.includes(i));
}
