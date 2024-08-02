import {
  Collection,
  CollectionGroup,
  CollectionItem,
  DEFAULT_ITEM,
  Item,
} from "./index";
import missing from "../image/placeholder.webp";
import { flattenDadDb } from "./transforms";

export function getItemName(ci: CollectionItem): string {
  if (ci.items.length === 0) {
    return "empty";
  }

  if (ci.items.length === 1) {
    const baseItem = ci.items[0];

    // transmog name overrides base
    if (baseItem.transmogName) {
      return baseItem.transmogName;
    }

    return baseItem.name;
  }

  const itemPeek = ci.items[0];
  switch (itemPeek.itemType.name) {
    case "Player Title (Prefix)":
    case "Player Title (Suffix)":
      return ci.items.map((i) => i.name).join(" ");
    default:
      return itemPeek.name;
  }
}

export function getItemType(ci: CollectionItem): string {
  if (ci.items.length === 0) {
    return "empty";
  }

  if (ci.items.length === 1) {
    return ci.items[0].itemType.name;
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

export function getDefaultItemFromCollectionItems(
  collectionItems: CollectionItem,
): Item {
  return collectionItems.items[0] ?? DEFAULT_ITEM;
}

export function getDiabloItemIds(collectionItem: CollectionItem): number[] {
  return collectionItem.items.map((ci) => ci.id);
}
