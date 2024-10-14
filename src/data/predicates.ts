import { CharacterClass, Collection, CollectionItem, Item } from "./index";
import { wardrobeIcons } from "../common";

export function doesHaveWardrobePlaceholder(item: Item): boolean {
  return !!item.isTransmog && wardrobeIcons.includes(item.itemType.name);
}

export function isVesselOfHatredItem(item: Item): boolean {
  return !!item.vohItem;
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

export function hasItemVariation(
  ci: CollectionItem,
  characterClass: CharacterClass,
): boolean {
  return (
    ci.items.length > 1 &&
    ci.items.filter(
      (i) =>
        i.usableByClass.filter(
          (c, j) =>
            (c === 1 && j === characterClass) ||
            (c === 0 && j !== characterClass),
        ).length === 5,
    ).length !== 0
  );
}
