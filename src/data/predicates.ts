import { Collection, Item } from "./index";
import { wardrobeIcons } from "../common";

export function doesHaveWardrobePlaceholder(item: Item): boolean {
  return !!item.isTransmog && wardrobeIcons.includes(item.itemType.name);
}

export function isCollectionEmpty(collection: Collection): boolean {
  return (
    collection.collectionItems.length === 0 &&
    collection.subcollections.length === 0
  );
}

export function hasIconVariants(item: Item): boolean {
  return (
    (item.invImages ?? []).filter((i) => i.some((j) => j !== null)).length > 1
  );
}
