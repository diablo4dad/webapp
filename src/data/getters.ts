import { enumKeys } from "../common/enums";
import missing from "../image/placeholder.webp";
import {
  CharacterClass,
  CharacterGender,
  Collection,
  CollectionGroup,
  CollectionItem,
  DEFAULT_ITEM,
  Item,
} from "./index";
import { flattenDadDb } from "./transforms";

export function getItemName(ci: CollectionItem, item: Item): string {
  if (ci.items.length <= 1) {
    // transmog name overrides base
    if (item.transmogName) {
      return item.transmogName;
    }

    return item.name;
  }

  switch (ci.items[0].itemType.name) {
    case "Player Title (Prefix)":
    case "Player Title (Suffix)":
      return ci.items.map((i) => i.name).join(" ");
    default:
      return item.name;
  }
}

export function getItemType(ci: CollectionItem, item: Item): string {
  if (ci.items.length <= 1) {
    return item.itemType.name;
  }

  const itemPeek = ci.items[0];
  switch (itemPeek.itemType.name) {
    case "Player Title (Prefix)":
    case "Player Title (Suffix)":
      return "Player Title";
    default:
      return itemPeek.itemType.name;
  }
}

export function getDefaultItemId(dadDb: CollectionGroup): number {
  return flattenDadDb(dadDb)[0]?.id ?? -1;
}

export function getAllCollectionItems(
  collection: Collection,
): CollectionItem[] {
  return [
    ...collection.collectionItems,
    ...collection.subcollections.flatMap(getAllCollectionItems),
  ];
}

export function getImageUri(item: Item): string {
  return item.icon ?? missing;
}

export function getDefaultItem(collectionItems: CollectionItem): Item {
  return collectionItems.items[0] ?? DEFAULT_ITEM;
}

export function getItemIds(collectionItem: CollectionItem): number[] {
  return collectionItem.items.map((ci) => ci.id);
}

export function getIconVariants(
  item: Item,
  gender: CharacterGender,
): [CharacterClass, string][] {
  return (item.invImages ?? [])
    .map((i, idx) => [idx as CharacterClass, i[gender] ?? null])
    .filter(([, i]) => i !== null) as [CharacterClass, string][];
}

export function getClassItemVariant(
  ci: CollectionItem,
  characterClass: CharacterClass,
): Item | undefined {
  return ci.items
    .filter(
      (i) =>
        i.usableByClass.filter((c, i) => c === 1 && i === characterClass)
          .length === 1,
    )
    .pop();
}

export function getClassIconVariant(
  item: Item,
  clazz: CharacterClass,
  gender: CharacterGender,
): string | undefined {
  const preferred = item.invImages?.[clazz]?.[gender];
  if (preferred) {
    return preferred;
  }

  for (const ccKey of enumKeys(CharacterClass)) {
    const ccValue = CharacterClass[ccKey];
    const img = item.invImages?.[ccValue]?.[gender];
    if (img !== null) {
      return img;
    }
  }
}
