import {MasterGroup} from "./common";
import {getCollectionUri} from "./server";
import {MODE} from "./config";

type Base<IconType> = {
  itemId: string,
  icon?: IconType,
  iconId?: number,
  name: string,
  description: string,
  usableByClass: string[],
  itemType: string,
  series: string,
  transmogName: string,
  magicType: string,
  transMog: boolean,
  dropMinWorldTier: number,
  dropMinLevel: number,
  dropMaxLevel: number,
}

export type StrapiResp = {
  createdAt?: string,
  publishedAt?: string,
  updatedAt?: string,
}

type Item<IconType> = Base<IconType> & StrapiResp;
type Headstone<IconType> = Base<IconType> & StrapiResp;
type Emote<IconType> = Base<IconType> & StrapiResp;
type Portal<IconType> = Base<IconType> & StrapiResp;

type CollectionItem<ItemsType> = StrapiResp & {
  outOfRotation?: boolean,
  premium?: boolean,
  promotional?: boolean,
  season?: number,
  claim?: string,
  claimDescription?: string,
  claimMonster?: string,
  claimZone?: string,
  items: ItemsType,
}

export type StrapiCollectionItem = CollectionItem<StrapiResultSet<StrapiItem>>;

type Collection<CollectionType, CollectionItemsType> = StrapiResp & {
  name: string,
  order: number,
  description: string,
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
  category: string,
  subcollections: CollectionType,
  collectionItems: CollectionItemsType,
}

type WithStrapiId = {
  strapiId: number
}

type StrapiMediaFormats = {
  thumbnail?: StrapiMediaFormat,
}

type StrapiMediaFormat = {
  ext: string,
  hash: string,
  height: number,
  mime: string,
  name: string,
  path?: string,
  size: number,
  url: string,
  width: number,
}

type StrapiMedia = {
  alternativeText?: string
  caption?: string,
  createdAt: string,
  ext: string,
  formats: StrapiMediaFormats,
  hash: string,
  height: number,
  mime: string,
  name: string,
  previewUrl?: string,
  provider: string,
  provider_metadata?: string,
  size: number,
  updatedAt: string,
  url: string,
  width: number,
}

type StrapiResult<T> = {
  data: StrapiHit<T>,
}

type StrapiSearchMeta = {
  pagination: StrapiPagination,
}

type StrapiPagination = {
  page: number,
  pageSize: number,
  pageCount: number,
  total: number,
}

type StrapiResultSet<T> = {
  data: StrapiHit<T>[],
  meta: StrapiSearchMeta,
}

type StrapiHit<T> = {
  id: number,
  attributes: T,
}

type StrapiItem = Item<StrapiResult<StrapiMedia>>;
type StrapiEmote = Emote<StrapiResult<StrapiMedia>>;
type StrapiHeadstone = Headstone<StrapiResult<StrapiMedia>>;
type StrapiPortal = Portal<StrapiResult<StrapiMedia>>;
// @ts-ignore
export type StrapiCollection = Collection<StrapiResultSet<StrapiCollection> | undefined, StrapiResultSet<StrapiCollectionItem> | undefined>;

type DadBase = Base<string> & WithStrapiId;
type DadItem = Item<string> & WithStrapiId;
type DadEmote = Emote<string> & WithStrapiId;
type DadHeadstone = Headstone<string> & WithStrapiId;
type DadPortal = Portal<string> & WithStrapiId;
type DadCollectionItem = CollectionItem<Array<DadItem | DadEmote | DadHeadstone | DadPortal>> & WithStrapiId;
type DadCollection = Collection<DadCollection[], DadCollectionItem[]> & WithStrapiId;
type DadDb = { collections: DadCollection[] }

function strapiBaseToDadBase(hit: StrapiHit<Base<StrapiResult<StrapiMedia>>>): Base<StrapiMedia> & WithStrapiId {
  return {
    ...hit.attributes,
    strapiId: hit.id,
    icon: hit.attributes.icon?.data?.attributes,
  };
}

function strapiItemToDadItem(hit: StrapiHit<StrapiItem>): DadItem {
  return {
    ...hit.attributes,
    strapiId: hit.id,
    icon: hit.attributes.icon?.data?.attributes.url,
  };
}

function strapiCollectionItemToDadCollectionItem(hit: StrapiHit<StrapiCollectionItem>): DadCollectionItem {
  const attributes = hit.attributes;
  const items = [];

  if (attributes.items) {
    items.push(...attributes.items.data.map(strapiItemToDadItem));
  }

  return {
    ...hit.attributes,
    strapiId: hit.id,
    items: items,
  };
}

function strapiCollectionToDadCollection(hit: StrapiHit<StrapiCollection>): DadCollection {
  return {
    ...hit.attributes,
    strapiId: hit.id,
    collectionItems: hit.attributes.collectionItems?.data.map(strapiCollectionItemToDadCollectionItem) ?? [],
    subcollections: hit.attributes.subcollections?.data.map(strapiCollectionToDadCollection) ?? [],
  };
}

function strapiToDad(strapiCollection: StrapiResultSet<StrapiCollection>): DadDb {
  return {
    collections: strapiCollection.data.map(strapiCollectionToDadCollection),
  };
}

const DEFAULT_ITEM: DadItem = {
  strapiId: -1,
  itemId: "missing",
  itemType: 'missing',
  magicType: "missing",
  icon: undefined,
  iconId: undefined,
  name: "missing",
  description: "missing",
  transMog: false,
  usableByClass: [],
  series: "missing",
  transmogName: "missing",
  dropMinWorldTier: 0,
  dropMinLevel: 1,
  dropMaxLevel: 100,
}

const DEFAULT_COLLECTION_ITEM: DadCollectionItem = {
  strapiId: -1,
  outOfRotation: false,
  premium: false,
  promotional: false,
  season: undefined,
  claim: "missing",
  claimDescription: "missing",
  claimMonster: "missing",
  claimZone: "missing",
  items: [],
}

const DEFAULT_COLLECTION: DadCollection = {
  strapiId: -1,
  name: "missing",
  order: 0,
  description: "missing",
  category: "missing",
  createdAt: '2023-12-01T10:00:00.000Z',
  publishedAt: '2023-12-01T10:00:00.000Z',
  updatedAt: '2023-12-01T10:00:00.000Z',
  collectionItems: [],
  subcollections: [],
}

function createEmptyDb(): DadDb {
  return {
    collections: [],
  }
}

function getDefaultItemIdForCollection(dadDb: DadDb): number {
  return dadDb.collections[0]?.collectionItems[0]?.strapiId ?? -1;
}

async function fetchDb(masterGroup: MasterGroup, page: number = 0): Promise<StrapiResultSet<StrapiCollection>> {
  return (await fetch(getCollectionUri(masterGroup, page, 25, MODE))).json() as Promise<StrapiResultSet<StrapiCollection>>;
}

export default fetchDb;
export { fetchDb, createEmptyDb, getDefaultItemIdForCollection, strapiToDad, DEFAULT_ITEM, DEFAULT_COLLECTION_ITEM, DEFAULT_COLLECTION };
export type {
  Item,
  Headstone,
  Portal,
  Emote,
  Collection,
  CollectionItem,
  StrapiHit,
  StrapiResultSet,
  StrapiMedia,
  StrapiMediaFormat,
  StrapiMediaFormats,
  DadItem,
  DadCollectionItem,
  DadCollection,
  DadDb,
  DadBase,
};

export function composeDescription(item: DadCollectionItem): string {
  // setting a description overrides inferred/default
  if (item.claimDescription) {
    return item.claimDescription;
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
      return `Season ${item.season} Battle Pass reward.`
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
      return "Dropped by killing players and looting Baleful Chests."
    case "World Drop":
      return "Dropped throughout sanctuary."
    default:
      return "Description unavailable.";
  }
}

export function getAggregatedItemType(ci: DadCollectionItem): string {
  if (ci.items.length === 0) {
    return "empty";
  }

  if (ci.items.length === 1) {
    return ci.items[0].itemType;
  }

  const itemPeek = ci.items[0];
  switch (itemPeek.itemType) {
    case "Player Title (Prefix)":
    case "Player Title (Suffix)":
      return "Player Title";
    default:
      return itemPeek.itemType;
  }
}

export function getAggregatedItemName(ci: DadCollectionItem): string {
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
  switch (itemPeek.itemType) {
    case "Player Title (Prefix)":
    case "Player Title (Suffix)":
      return ci.items.map(i => i.name).join(' ');
    default:
      return itemPeek.name;
  }
}

export function countItemsInDb(db: DadDb): number {
  return db.collections.reduce((a, c) => countItemsInCollection(c) + countItemsInSubCollection(c) + a, 0);
}

export function countItemsInCollection(collection: DadCollection): number {
  return collection.collectionItems.length;
}

export function countItemsInSubCollection(collection: DadCollection): number {
  return collection.subcollections.reduce((a, c) => a + countItemsInCollection(c), 0);
}

export function reduceItemIdsFromCollection(collection: DadCollection): number[] {
  return [...collection.collectionItems.map(ci => ci.strapiId), ...collection.subcollections.flatMap(reduceItemIdsFromCollection)];
}
