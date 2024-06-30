import { DadCollection, DadItem } from "./index";
import { wardrobeIcons } from "../common";

export function doesHaveWardrobePlaceholder(item: DadItem): boolean {
  return item.transMog && wardrobeIcons.includes(item.itemType);
}

export function isCollectionEmpty(collection: DadCollection): boolean {
  return (
    collection.collectionItems.length === 0 &&
    collection.subcollections.length === 0
  );
}
