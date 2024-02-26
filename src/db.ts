import {getCollectionUri} from "./config";
import {MasterGroup} from "./common";

type Base<IconType> = {
  itemId: string,
  icon?: IconType,
  iconId?: number,
  name: string,
  description: string,
  usableByClass: string[],
  itemType: string,
}

type StrapiResp = {
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
}

type Item<IconType> = Base<IconType> & {
  itemType: string,
  magicType: string,
  transMog: boolean,
}

type Headstone<IconType> = Base<IconType>;
type Emote<IconType> = Base<IconType>;
type Portal<IconType> = Base<IconType>;

type CollectionItem<ItemsType> = {
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

type StrapiCollectionItem = CollectionItem<StrapiResultSet<StrapiItem>> & {
  emote?: StrapiResult<StrapiEmote> | null,
  headstone?: StrapiResult<StrapiHeadstone> | null,
  portal?: StrapiResult<StrapiPortal> | null,
}

type Collection<CollectionItemsType> = {
  name: string,
  order: number,
  description: string,
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
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

type StrapiResultSet<T> = {
  data: StrapiHit<T>[],
  meta?: {},
}

type StrapiHit<T> = {
  id: number,
  attributes: T,
}

type StrapiItem = Item<StrapiResult<StrapiMedia>>;
type StrapiEmote = Emote<StrapiResult<StrapiMedia>>;
type StrapiHeadstone = Headstone<StrapiResult<StrapiMedia>>;
type StrapiPortal = Portal<StrapiResult<StrapiMedia>>;
type StrapiCollection = Collection<StrapiResultSet<StrapiCollectionItem> | undefined>;

type DadBase = Base<StrapiMedia> & WithStrapiId;
type DadItem = Item<StrapiMedia> & WithStrapiId;
type DadEmote = Emote<StrapiMedia> & WithStrapiId;
type DadHeadstone = Headstone<StrapiMedia> & WithStrapiId;
type DadPortal = Portal<StrapiMedia> & WithStrapiId;
type DadCollectionItem = CollectionItem<Array<DadItem | DadEmote | DadHeadstone | DadPortal>> & WithStrapiId;
type DadCollection = Collection<DadCollectionItem[]> & WithStrapiId;
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
    icon: hit.attributes.icon?.data?.attributes,
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
  createdAt: '2023-12-01T10:00:00.000Z',
  publishedAt: '2023-12-01T10:00:00.000Z',
  updatedAt: '2023-12-01T10:00:00.000Z',
  collectionItems: [],
}

function createEmptyDb(): DadDb {
  return {
    collections: [],
  }
}

function getDefaultItemIdForCollection(dadDb: DadDb): number {
  return dadDb.collections[0]?.collectionItems[0]?.strapiId ?? -1;
}

async function fetchDb(masterGroup: MasterGroup): Promise<StrapiResultSet<StrapiCollection>> {
  return (await fetch(getCollectionUri(masterGroup))).json();
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
    default:
      return "Description unavailable.";
  }
}