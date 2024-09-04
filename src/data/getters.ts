import {
  CharacterClass,
  CharacterGender,
  Collection,
  CollectionGroup,
  CollectionItem,
  DEFAULT_ITEM,
  Item,
} from "./index";
import missing from "../image/placeholder.webp";
import { flattenDadDb } from "./transforms";
import { enumKeys } from "../common/enums";

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

function stringParser(input: string): string {
  input = input.replace("{icon:Icon_WorldTier_4, 2.5}", "World Tier IV");

  return input;
}

export function getItemDescription(item: CollectionItem): string {
  // setting a description overrides inferred/default
  if (item.claimDescription) {
    return stringParser(item.claimDescription);
  }

  // unique items
  if (item.items.length) {
    const baseItem = item.items[0];
    if (baseItem.transmogName) {
      return `Salvaged from ${baseItem.name}.`;
    }
  }

  switch (item.claim) {
    case "Cash Shop":
      return "Purchased from the cash shop.";
    case "Accelerated Battle Pass":
    case "Battle Pass":
      return `Season ${item.season} Battle Pass reward.`;
    case "Monster Drop":
    case "Boss Drop":
    case "World Boss Drop":
    case "Uber Boss Drop":
      return `Dropped by ${item.claimMonster}.`;
    case "Zone Drop":
      if (item.claimZone === "Sanctuary") {
        return `Dropped by monsters and chests throughout ${item.claimZone}.`;
      } else {
        return `Dropped by monsters and chests within ${item.claimZone}.`;
      }
    case "Challenge Reward":
      return "Awarded for completing a challenge.";
    case "Promotional":
      return "This is a limited time promotional item.";
    case "Vendor":
      return "Purchased from a vendor.";
    case "PvP Drop":
      return "Dropped by killing players and looting Baleful Chests.";
    case "World Drop":
      return "Dropped throughout sanctuary.";
    default:
      return "Description unavailable.";
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
